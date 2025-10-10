// Match Details Modal Component
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Calendar, Heart, User, Check, X as XIcon, Loader2, Lock, Unlock } from 'lucide-react';
import type { Match } from '@/types';
import { useToast } from '@/components/shared/Toast';

interface MatchDetailsModalProps {
  match: Match | null;
  isOpen: boolean;
  onClose: () => void;
  onAccept?: (matchId: string) => Promise<void>;
  onReject?: (matchId: string) => Promise<void>;
}

export function MatchDetailsModal({
  match,
  isOpen,
  onClose,
  onAccept,
  onReject,
}: MatchDetailsModalProps) {
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const { showToast } = useToast();

  if (!match) return null;

  const handleAccept = async () => {
    if (!onAccept) return;
    setIsAccepting(true);
    
    try {
      await onAccept(match.id);
      showToast('Match accepted! 🎉', 'success');
      onClose();
    } catch (error) {
      console.error('Failed to accept match:', error);
      showToast('Failed to accept match. Please try again.', 'error');
    } finally {
      setIsAccepting(false);
    }
  };

  const handleReject = async () => {
    if (!onReject) return;
    setIsRejecting(true);
    
    try {
      await onReject(match.id);
      showToast('Match rejected', 'info');
      onClose();
    } catch (error) {
      console.error('Failed to reject match:', error);
      showToast('Failed to reject match. Please try again.', 'error');
    } finally {
      setIsRejecting(false);
    }
  };

  const getStatusColor = () => {
    switch (match.status) {
      case 'mutual':
        return 'text-green-400';
      case 'revealed':
        return 'text-blue-400';
      default:
        return 'text-yellow-400';
    }
  };

  const getStatusLabel = () => {
    switch (match.status) {
      case 'mutual':
        return 'Mutual Match';
      case 'revealed':
        return 'Details Revealed';
      default:
        return 'Pending';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[90vw] md:max-w-2xl md:max-h-[85vh] bg-gray-900 rounded-2xl shadow-2xl border border-gray-800 z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <div>
                <h2 className="text-2xl font-bold">Match Details</h2>
                <p className={`text-sm font-medium mt-1 ${getStatusColor()}`}>
                  {getStatusLabel()}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Match Score */}
              <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-600/30 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Compatibility Score</h3>
                  <div className="text-4xl font-bold text-blue-400">{match.matchScore}%</div>
                </div>
                
                {/* Score Breakdown */}
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-400">Route Overlap</span>
                      <span className="font-medium">{match.routeOverlap}%</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${match.routeOverlap}%` }}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-400">Date Overlap</span>
                      <span className="font-medium">{match.dateOverlap} days</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min((match.dateOverlap / 30) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-400">Interest Similarity</span>
                      <span className="font-medium">{Math.round(match.interestSimilarity * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full transition-all"
                        style={{ width: `${match.interestSimilarity * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Privacy Info */}
              {match.status === 'pending' && (
                <div className="bg-yellow-600/10 border border-yellow-600/20 rounded-lg p-4 flex gap-3">
                  <Lock className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-400">
                    <p className="font-semibold mb-1">Privacy Protected</p>
                    <p className="text-yellow-400/80">
                      Exact routes and details are encrypted. Scores are computed using Arcium MPC
                      without revealing your location. Accept to enable mutual contact.
                    </p>
                  </div>
                </div>
              )}

              {match.status === 'mutual' && (
                <div className="bg-green-600/10 border border-green-600/20 rounded-lg p-4 flex gap-3">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-green-400">
                    <p className="font-semibold mb-1">Mutual Match! 🎉</p>
                    <p className="text-green-400/80">
                      Both parties have accepted. You can now see each other's contact info and
                      coordinate your travel plans.
                    </p>
                  </div>
                </div>
              )}

              {match.status === 'revealed' && (
                <div className="bg-blue-600/10 border border-blue-600/20 rounded-lg p-4 flex gap-3">
                  <Unlock className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-400">
                    <p className="font-semibold mb-1">Details Revealed</p>
                    <p className="text-blue-400/80">
                      Full trip details are now accessible to both parties.
                    </p>
                  </div>
                </div>
              )}

              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-400 mb-2">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm font-medium">Proximity</span>
                  </div>
                  <p className="text-lg font-semibold">{match.proximity || 'Unknown'}</p>
                </div>

                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-400 mb-2">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm font-medium">Matched On</span>
                  </div>
                  <p className="text-lg font-semibold">
                    {new Date(match.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Revealed Details (only if status is 'revealed') */}
              {match.status === 'revealed' && (
                <div className="bg-gray-800 rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold">Revealed Travel Details</h4>
                  <p className="text-sm text-gray-400">
                    Full route and contact information would be displayed here after mutual acceptance.
                  </p>
                  {/* TODO: Display actual revealed data from Arcium decryption */}
                </div>
              )}
            </div>

            {/* Footer Actions */}
            {match.status === 'pending' && (onAccept || onReject) && (
              <div className="flex items-center gap-3 px-6 py-4 border-t border-gray-800">
                {onReject && (
                  <button
                    onClick={handleReject}
                    disabled={isRejecting}
                    className="flex-1 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isRejecting && <Loader2 className="w-4 h-4 animate-spin" />}
                    <XIcon className="w-4 h-4" />
                    {isRejecting ? 'Rejecting...' : 'Reject'}
                  </button>
                )}
                
                {onAccept && (
                  <button
                    onClick={handleAccept}
                    disabled={isAccepting}
                    className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isAccepting && <Loader2 className="w-4 h-4 animate-spin" />}
                    <Check className="w-4 h-4" />
                    {isAccepting ? 'Accepting...' : 'Accept Match'}
                  </button>
                )}
              </div>
            )}

            {match.status !== 'pending' && (
              <div className="px-6 py-4 border-t border-gray-800">
                <button
                  onClick={onClose}
                  className="w-full px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
