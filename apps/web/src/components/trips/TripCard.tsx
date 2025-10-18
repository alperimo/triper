/**
 * Trip Card Component
 * 
 * Displays trip information with archive status and actions.
 * 
 * FEATURES:
 * - Archive status badge (traditional vs compressed)
 * - Manual archive button ("Archive & Save $0.39")
 * - Read-only indicator for compressed trips
 * - Auto-archive suggestion for old trips (>30 days past end)
 * 
 * ARCHITECTURE:
 * - Traditional trips: Can be edited, use ~$0.39 storage
 * - Compressed trips: Read-only, use ~$0.06 storage (85% savings)
 */

'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PublicKey } from '@solana/web3.js';
import type { Trip } from '@/types';
import { isAccountCompressed } from '@/lib/services/light-rpc';
import { useTrips } from '@/hooks/useTrips';

interface TripCardProps {
  trip: Trip;
  index?: number;
  onArchive?: (tripId: string) => void;
}

export function TripCard({ trip, index = 0, onArchive }: TripCardProps) {
  const [isCompressed, setIsCompressed] = useState(false);
  const [checkingCompression, setCheckingCompression] = useState(false);
  const [showArchiveButton, setShowArchiveButton] = useState(false);
  const { archiveTrip } = useTrips();

  // Check if trip is compressed (lazy check on mount)
  useEffect(() => {
    let mounted = true;

    async function checkCompression() {
      try {
        setCheckingCompression(true);
        const tripPDA = new PublicKey(trip.id);
        const compressed = await isAccountCompressed(tripPDA);
        
        if (mounted) {
          setIsCompressed(compressed);
          
          // Show archive button if:
          // 1. Not compressed
          // 2. Trip ended >30 days ago
          // 3. Trip is inactive
          const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
          const shouldArchive = !compressed && 
                                trip.endDate.getTime() < thirtyDaysAgo && 
                                !trip.isActive;
          setShowArchiveButton(shouldArchive);
        }
      } catch (err) {
        console.error('Failed to check compression status:', err);
      } finally {
        if (mounted) {
          setCheckingCompression(false);
        }
      }
    }

    checkCompression();

    return () => {
      mounted = false;
    };
  }, [trip.id, trip.endDate, trip.isActive]);

  const handleArchive = async () => {
    try {
      await archiveTrip(trip.id);
      setIsCompressed(true);
      setShowArchiveButton(false);
      onArchive?.(trip.id);
    } catch (err) {
      console.error('Failed to archive trip:', err);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    }).format(date);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 * index }}
      className={`bg-gray-900/50 border rounded-lg p-6 ${
        isCompressed 
          ? 'border-blue-500/30 bg-blue-500/5' 
          : 'border-white/10'
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white mb-1">
            Trip #{trip.id.slice(0, 8)}...
          </h3>
          
          {/* Archive Status Badge */}
          {checkingCompression ? (
            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
              <span className="animate-spin">⏳</span> Checking...
            </span>
          ) : isCompressed ? (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full border border-blue-500/30">
              📦 Archived (Read-Only)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
              ✏️ Active
            </span>
          )}
        </div>

        {/* Archive Button (for old trips) */}
        {showArchiveButton && !checkingCompression && (
          <button
            onClick={handleArchive}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-sm rounded-lg border border-blue-500/30 transition-colors"
            title="Compress this trip to save storage costs"
          >
            <span>📦</span>
            <span className="hidden sm:inline">Archive & Save $0.39</span>
            <span className="sm:hidden">Archive</span>
          </button>
        )}
      </div>

      <div className="space-y-2 text-sm text-gray-400">
        <div className="flex items-center gap-2">
          <span>📅</span>
          <span>{formatDate(trip.startDate)} - {formatDate(trip.endDate)}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span>🎒</span>
          <span className="capitalize">{trip.travelStyle}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span>🔒</span>
          <span>Route encrypted via Arcium MPC</span>
        </div>

        {trip.interests && trip.interests.length > 0 && (
          <div className="flex items-start gap-2">
            <span>✨</span>
            <div className="flex flex-wrap gap-1">
              {trip.interests.map((interest) => (
                <span 
                  key={interest}
                  className="px-2 py-0.5 bg-white/5 text-xs rounded-full"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Storage Cost Indicator */}
        <div className="pt-2 mt-2 border-t border-white/5 flex items-center justify-between">
          <span className="text-xs text-gray-500">
            Storage cost:
          </span>
          {isCompressed ? (
            <span className="text-xs text-blue-400">
              ~$0.06 <span className="text-gray-600">(85% saved)</span>
            </span>
          ) : (
            <span className="text-xs text-gray-400">
              ~$0.39
            </span>
          )}
        </div>
      </div>

      {/* Read-Only Warning for Compressed Trips */}
      {isCompressed && (
        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-xs text-blue-400">
            ℹ️ This trip has been archived to save storage costs. 
            Archived trips are read-only and cannot be edited or reactivated.
          </p>
        </div>
      )}

      {/* Auto-Archive Suggestion */}
      {showArchiveButton && (
        <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <p className="text-xs text-yellow-400">
            💡 This trip ended over 30 days ago. Archive it to save $0.33 in storage costs!
          </p>
        </div>
      )}
    </motion.div>
  );
}

export default TripCard;
