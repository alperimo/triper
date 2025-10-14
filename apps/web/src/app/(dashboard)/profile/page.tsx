'use client';

import { useState } from 'react';
import { useUserStore } from '@/lib/store/user';
import { useTripStore } from '@/lib/store/trip';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { PlusIcon, MapIcon } from '@heroicons/react/24/outline';

export default function ProfilePage() {
  const { publicKey, disconnect } = useUserStore();
  const { myTrips: trips } = useTripStore();

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-950 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-white/10 rounded-lg p-8"
        >
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-2xl">
                👤
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white mb-1">Your Profile</h1>
                <p className="text-gray-400 font-mono text-sm">
                  {publicKey ? truncateAddress(publicKey) : 'Not connected'}
                </p>
              </div>
            </div>
            <button
              onClick={disconnect}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors"
            >
              Disconnect
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-3xl font-bold text-white mb-1">{trips.length}</div>
              <div className="text-sm text-gray-400">Active Trips</div>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-3xl font-bold text-white mb-1">0</div>
              <div className="text-sm text-gray-400">Total Matches</div>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-3xl font-bold text-white mb-1">0</div>
              <div className="text-sm text-gray-400">Connections</div>
            </div>
          </div>
        </motion.div>

        {/* Trips Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-xl font-bold text-white mb-4">Your Trips</h2>
          {trips.length === 0 ? (
            <div className="bg-gray-900/50 border border-white/10 rounded-lg p-8 text-center">
              <div className="text-6xl mb-4">✈️</div>
              <h3 className="text-lg font-medium text-gray-300 mb-2">No trips yet</h3>
              <p className="text-gray-500 mb-4">
                Create your first trip to start matching with travelers
              </p>
              <Link 
                href="/map"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-lg transition-colors"
              >
                <MapIcon className="w-5 h-5" />
                <span>Plan Your Route</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Add Trip Button */}
              <Link 
                href="/map"
                className="flex items-center justify-center gap-2 w-full py-3 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/50 rounded-lg transition-colors"
              >
                <PlusIcon className="w-5 h-5" />
                <span>Create New Trip</span>
              </Link>
              
              {/* Trips List */}
              <div className="grid gap-4">
                {trips.map((trip, index) => (
                  <motion.div
                    key={trip.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="bg-gray-900/50 border border-white/10 rounded-lg p-6"
                  >
                    <h3 className="text-lg font-semibold text-white mb-2">Trip #{trip.id.slice(0, 8)}</h3>
                    <div className="space-y-2 text-sm text-gray-400">
                      <div>📅 {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}</div>
                      <div>🎒 {trip.travelStyle}</div>
                      <div>🔒 Route encrypted</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Privacy Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-6"
        >
          <div className="flex items-start gap-3">
            <div className="text-2xl">🔐</div>
            <div>
              <h3 className="text-lg font-semibold text-blue-300 mb-2">Your Privacy is Protected</h3>
              <ul className="space-y-1 text-sm text-gray-400">
                <li>✓ Routes encrypted via Arcium MPC</li>
                <li>✓ Location obfuscated to ~10km grid cells</li>
                <li>✓ Matches computed without revealing data</li>
                <li>✓ Details only revealed with mutual consent</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
