'use client';

import { useUserStore } from '@/lib/store/user';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isConnected } = useUserStore();
  const pathname = usePathname();

  // Redirect to landing if not connected
  if (!isConnected) {
    redirect('/');
  }

  const navItems = [
    { name: 'Map', href: '/map' },
    { name: 'Matches', href: '/matches' },
    { name: 'Profile', href: '/profile' },
  ];

  const isMapPage = pathname === '/map';

  return (
    <div className={isMapPage ? "relative h-screen overflow-hidden" : "flex h-screen flex-col bg-white"}>
      {/* Header - Floating on map, normal on other pages */}
      <header className={isMapPage 
        ? "absolute left-0 right-0 top-0 z-50 border-b border-white/10 bg-white/5 backdrop-blur-xl"
        : "relative z-50 border-b border-white/10 bg-white/80 backdrop-blur-xl"
      }>
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-white/5 to-transparent" />
        </div>

        <div className="relative flex w-full items-center justify-between px-4 py-3 sm:px-6">
          {/* Brand - Landing page style */}
          <Link href="/map" className="flex items-center gap-2">
            <div className="relative h-12 w-12">
              <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-md" />
              <Image src="/logo.svg" alt="Triper Logo" fill className="relative rounded-2xl object-contain" />
            </div>
            <span className="text-sm font-semibold uppercase tracking-[0.35em] text-gray-900">Triper</span>
          </Link>

          {/* Desktop navigation */}
          <nav className="hidden items-center gap-2 rounded-full border border-white/20 bg-white/15 p-1 shadow-sm backdrop-blur-md md:flex">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative inline-flex items-center rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    isActive ? 'text-white' : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="nav-active-pill"
                      className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-primary-dark shadow-sm"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    />
                  )}
                  <span className="relative z-10">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className={isMapPage ? "h-full w-full" : "relative flex-1 overflow-hidden bg-white"}>{children}</main>

      {/* Mobile Navigation */}
      <nav className={isMapPage
        ? "absolute bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-white/5 px-3 py-3 backdrop-blur-xl md:hidden"
        : "md:hidden border-t border-white/10 bg-white/80 px-3 py-3 backdrop-blur-xl"
      }>
        <div className="grid grid-cols-3 gap-2">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'text-white'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                {isActive && (
                  <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary to-primary-dark shadow-sm" />
                )}
                <span className="relative z-10">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
