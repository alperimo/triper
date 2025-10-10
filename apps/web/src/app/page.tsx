'use client';

import { WalletButton } from '@/components/wallet/WalletButton';
import { MapView } from '@/components/map/MapView';
import { useUserStore } from '@/lib/store/user';
import { motion } from 'framer-motion';

export default function Home() {
  const { isConnected } = useUserStore();
  
  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-8 max-w-2xl px-4"
        >
          {/* Logo/Icon */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-purple-500 blur-3xl opacity-50" />
              <svg className="w-20 h-20 relative text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
          
          {/* Title */}
          <div className="space-y-4">
            <h1 className="text-6xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              Triper
            </h1>
            <p className="text-xl text-gray-300">
              Find travel companions without revealing your location
            </p>
            <p className="text-sm text-gray-400 max-w-lg mx-auto">
              Using Arcium&apos;s encrypted compute, your travel plans stay private. 
              Match with nearby travelers based on routes, dates, and interests—without exposing personal details.
            </p>
          </div>
          
          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-400 mt-8">
            <div className="bg-white/5 backdrop-blur-sm p-4 rounded-lg border border-white/10">
              <div className="text-purple-400 mb-2">🔐</div>
              <div className="font-medium text-white">Encrypted Location</div>
              <div className="text-xs mt-1">Routes computed via MPC</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm p-4 rounded-lg border border-white/10">
              <div className="text-blue-400 mb-2">🗺️</div>
              <div className="font-medium text-white">Private Matching</div>
              <div className="text-xs mt-1">See matches without revealing identity</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm p-4 rounded-lg border border-white/10">
              <div className="text-pink-400 mb-2">✨</div>
              <div className="font-medium text-white">Zero-Knowledge</div>
              <div className="text-xs mt-1">Prove compatibility privately</div>
            </div>
          </div>
          
          {/* CTA */}
          <div className="pt-8">
            <WalletButton />
            <p className="text-xs text-gray-500 mt-4">
              Connect your Solana wallet to start your encrypted journey
            </p>
          </div>
          
          {/* Footer */}
          <div className="pt-8 text-xs text-gray-600">
            <p>Powered by Arcium • Built for Cypherpunk Hackathon 2025</p>
          </div>
        </motion.div>
      </div>
    );
  }
  
  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-gray-900/80 backdrop-blur-md border-b border-white/10 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg className="w-8 h-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Triper
            </h1>
          </div>
          
          <WalletButton />
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-1 relative">
        <MapView />
      </main>
    </div>
  );
}
