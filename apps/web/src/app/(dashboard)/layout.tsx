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
    <div className="h-screen flex flex-col bg-white">
      {/* Header - Navbar with edge-to-edge content */}
      <header className="bg-secondary border-b border-gray-200 px-2.5 py-3 relative z-50">
        <div className="flex items-center justify-between">
          {/* Logo - Left (close to edge) */}
          <Link href="/map" className="flex items-center gap-0.25 group">
            <Image 
              src="/logo.svg" 
              alt="Triper Logo" 
              width={48} 
              height={48} 
              className="group-hover:opacity-80 transition-opacity"
            />
            <h1 className="text-lg font-semibold text-gray-900">
              Triper
            </h1>
          </Link>

          {/* Navigation - Right side (close to edge) */}
          <nav className="hidden md:flex items-center gap-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-lg text-[15px] transition-all ${
                    isActive 
                      ? 'bg-secondary-hover text-gray-900 font-medium' 
                      : 'text-gray-900 hover:bg-secondary-dark/50'
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative overflow-hidden bg-white">
        {children}
      </main>

      {/* Mobile Navigation */}
      <nav className="md:hidden bg-secondary border-t border-gray-200 px-2 py-2">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-secondary-hover text-gray-900' 
                    : 'text-gray-900 hover:bg-secondary-dark/50'
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
