'use client';

import { useState } from 'react';
import { useMatchStore } from '@/lib/store/match';
import { useMatches } from '@/hooks/useMatches';
import { motion } from 'framer-motion';
import { MatchDetailsModal } from '@/components/matches/MatchDetailsModal';
import type { Match } from '@/types';

export default function MatchesPage() {
  const { matches } = useMatchStore();
  const { acceptMatch, rejectMatch } = useMatches();
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleMatchClick = (match: Match) => {
    setSelectedMatch(match);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMatch(null);
  };

  return (
    <div className="h-full overflow-y-auto bg-white p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Matches</h1>
          <p className="text-gray-600">
            {matches.length} encrypted match{matches.length !== 1 ? 'es' : ''} found
          </p>
        </div>

        {matches.length === 0 ? (
          <div className="bg-secondary border border-gray-200 rounded-lg text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No matches yet</h3>
            <p className="text-gray-600">
              Create a trip to start finding travel companions
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {matches.map((match, index) => (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleMatchClick(match)}
                className="bg-secondary border border-gray-200 rounded-lg p-6 hover:border-primary hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      Match #{match.id.slice(0, 8)}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {match.status === 'pending' && '⏳ Pending acceptance'}
                      {match.status === 'mutual' && '✅ Mutually accepted'}
                      {match.status === 'revealed' && '🔓 Details revealed'}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">
                      {match.matchScore}%
                    </div>
                    <div className="text-xs text-gray-500">Compatibility</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500">📍 Proximity:</span>
                    <span className="text-gray-900">{match.proximity}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500">📅 Date overlap:</span>
                    <span className="text-gray-900">{match.dateOverlap} days</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Match Details Modal */}
      <MatchDetailsModal
        match={selectedMatch}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onAccept={acceptMatch}
        onReject={rejectMatch}
      />
    </div>
  );
}
