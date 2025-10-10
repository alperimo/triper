'use client';

import { useUserStore } from '@/lib/store/user';
import { WalletButton } from '@/components/wallet/WalletButton';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

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
    { name: 'Map', href: '/map', icon: '🗺️' },
    { name: 'Matches', href: '/matches', icon: '✨' },
    { name: 'Profile', href: '/profile', icon: '👤' },
  ];

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-gray-900/80 backdrop-blur-md border-b border-white/10 px-6 py-4 z-10">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/map" className="flex items-center gap-3 group">
            <svg 
              className="w-8 h-8 text-purple-400 group-hover:text-purple-300 transition-colors" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Triper
            </h1>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative px-4 py-2 rounded-lg transition-colors"
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-purple-500/20 rounded-lg"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative flex items-center gap-2">
                    <span>{item.icon}</span>
                    <span className={isActive ? 'text-purple-300' : 'text-gray-400 hover:text-gray-300'}>
                      {item.name}
                    </span>
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Wallet Button */}
          <WalletButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative overflow-hidden">
        {children}
      </main>

      {/* Mobile Navigation */}
      <nav className="md:hidden bg-gray-900/80 backdrop-blur-md border-t border-white/10 px-4 py-3">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-1"
              >
                <span className="text-2xl">{item.icon}</span>
                <span className={`text-xs ${isActive ? 'text-purple-300' : 'text-gray-400'}`}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
