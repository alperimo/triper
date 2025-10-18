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

  return (
    <div className="flex h-screen flex-col bg-white">
      {/* Header */}
      <header className="relative z-50 border-b border-white/15 bg-white/10 backdrop-blur-2xl">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-white/50 via-white/10 to-transparent" />
          <div className="absolute -left-32 top-1/2 h-52 w-52 -translate-y-1/2 rounded-full bg-primary/12 blur-3xl" />
          <div className="absolute right-[-25%] top-[-80%] h-64 w-64 rounded-full bg-[#cfe9d5]/25 blur-3xl" />
        </div>

        <div className="relative flex w-full items-center justify-between px-4 py-3 sm:px-6">
          {/* Brand */}
          <Link href="/map" className="group flex items-center gap-3">
            <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-white/40 shadow-[var(--shadow-soft)] transition duration-300 group-hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-primary/5 to-primary/25" />
              <Image
                src="/logo.svg"
                alt="Triper Logo"
                width={36}
                height={36}
                className="relative h-9 w-9 transition-opacity duration-300 group-hover:opacity-90"
              />
            </div>
            <span className="text-lg font-semibold text-gray-900 sm:text-xl">
              Triper
            </span>
          </Link>

          {/* Desktop navigation */}
          <nav className="hidden items-center gap-2 rounded-full border border-white/30 bg-white/20 p-1 shadow-[var(--shadow-soft)] backdrop-blur md:flex">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative inline-flex items-center rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    isActive ? 'text-white' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="nav-active-pill"
                      className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-primary-dark shadow-[var(--shadow-soft)]"
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
      <main className="relative flex-1 overflow-hidden bg-white">{children}</main>

      {/* Mobile Navigation */}
      <nav className="md:hidden border-t border-white/20 bg-white/20 px-3 py-3 backdrop-blur-2xl">
        <div className="grid grid-cols-3 gap-2">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative inline-flex items-center justify-center rounded-2xl px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'text-white'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                {isActive && (
                  <span className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary to-primary-dark shadow-[var(--shadow-soft)]" />
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
