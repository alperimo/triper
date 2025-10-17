'use client';

import { useMemo, useState } from 'react';
import { useMatchStore } from '@/lib/store/match';
import { useMatches } from '@/hooks/useMatches';
import { motion } from 'framer-motion';
import { MatchDetailsModal } from '@/components/matches/MatchDetailsModal';
import type { Match, MatchStatus } from '@/types';
import {
  FunnelIcon,
  ChartBarIcon,
  ArrowTopRightOnSquareIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

type StatusFilter = 'all' | MatchStatus;

const statusOptions: Array<{
  label: string;
  value: StatusFilter;
  description: string;
}> = [
  { label: 'All matches', value: 'all', description: 'Every encrypted candidate' },
  { label: 'Pending', value: 'pending', description: 'Awaiting your decision' },
  { label: 'Interested', value: 'interested', description: 'You signalled interest' },
  { label: 'Mutual', value: 'mutual', description: 'Ready to reveal details' },
  { label: 'Revealed', value: 'revealed', description: 'Full itineraries unlocked' },
];

const statusMeta: Record<
  MatchStatus,
  { label: string; badge: string; dot: string }
> = {
  pending: {
    label: 'Pending acceptance',
    badge: 'bg-amber-100 text-amber-700',
    dot: 'bg-amber-400',
  },
  viewed: {
    label: 'Viewed privately',
    badge: 'bg-slate-100 text-slate-600',
    dot: 'bg-slate-400',
  },
  interested: {
    label: 'You are interested',
    badge: 'bg-blue-100 text-blue-700',
    dot: 'bg-blue-500',
  },
  mutual: {
    label: 'Mutual match',
    badge: 'bg-emerald-100 text-emerald-700',
    dot: 'bg-emerald-500',
  },
  revealed: {
    label: 'Details revealed',
    badge: 'bg-purple-100 text-purple-700',
    dot: 'bg-purple-500',
  },
  expired: {
    label: 'Expired',
    badge: 'bg-gray-100 text-gray-500',
    dot: 'bg-gray-400',
  },
};

const formatDate = (date: Date) =>
  date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

export default function MatchesPage() {
  const { matches } = useMatchStore();
  const { acceptMatch, rejectMatch } = useMatches();
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [actionState, setActionState] = useState<{ id: string; action: 'accept' | 'reject' } | null>(null);

  const filteredMatches = useMemo(() => {
    if (statusFilter === 'all') return matches;
    return matches.filter((match) => match.status === statusFilter);
  }, [matches, statusFilter]);

  const handleMatchClick = (match: Match) => {
    setSelectedMatch(match);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMatch(null);
  };

  const handleAcceptMatch = async (matchId: string) => {
    setActionState({ id: matchId, action: 'accept' });
    try {
      await acceptMatch(matchId);
    } finally {
      setActionState(null);
    }
  };

  const handleRejectMatch = async (matchId: string) => {
    setActionState({ id: matchId, action: 'reject' });
    try {
      await rejectMatch(matchId);
    } finally {
      setActionState(null);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-10 lg:flex-row">
        <aside className="lg:w-64 lg:flex-shrink-0">
          <div className="rounded-[32px] border border-white/40 bg-white/80 px-5 py-6 shadow-[var(--shadow-soft)] backdrop-blur">
            <div className="mb-6 flex items-center gap-2 text-sm font-semibold text-gray-900">
              <FunnelIcon className="h-5 w-5 text-primary" />
              Refine results
            </div>
            <div className="space-y-3">
              {statusOptions.map((option) => {
                const isActive = statusFilter === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => setStatusFilter(option.value)}
                    className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                      isActive
                        ? 'border-primary/30 bg-primary/10 text-primary shadow-[var(--shadow-soft)]'
                        : 'border-white/60 bg-white/70 text-gray-600 hover:border-primary/20 hover:text-gray-900'
                    }`}
                  >
                    <p className="text-sm font-semibold">{option.label}</p>
                    <p className="mt-1 text-xs text-gray-500">{option.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6 rounded-[32px] border border-white/40 bg-white/80 px-5 py-6 shadow-[var(--shadow-soft)] backdrop-blur">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <ChartBarIcon className="h-5 w-5 text-primary" />
              Match insights
            </div>
            <p className="mt-3 text-xs text-gray-500">
              Compatibility scores blend route overlap, date alignment, and encrypted interest graphs. Only mutual matches unlock precise
              itineraries.
            </p>
          </div>
        </aside>

        <div className="flex-1 space-y-8">
          <header className="flex flex-col gap-6 rounded-[32px] border border-white/40 bg-white/80 px-6 py-6 shadow-[var(--shadow-soft)] backdrop-blur">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-primary">Encrypted matchmaking</p>
                <h1 className="text-3xl font-semibold text-gray-900">Your matches</h1>
              </div>
              <div className="rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                {filteredMatches.length} match{filteredMatches.length === 1 ? '' : 'es'} in view
              </div>
            </div>
            <div className="flex flex-col gap-4 text-sm text-gray-600 md:flex-row md:items-center md:justify-between">
              <div>
                Awaiting action? Filter by status to focus on matches that need your response. Accept to unlock mutual reveal on-chain.
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/70 px-4 py-2 text-xs font-medium text-gray-500">
                <ShieldCheckIcon className="h-4 w-4 text-primary" />
                No locations revealed until both parties accept.
              </div>
            </div>
          </header>

          {filteredMatches.length === 0 ? (
            <div className="rounded-[32px] border border-dashed border-primary/30 bg-white/80 px-8 py-16 text-center shadow-[var(--shadow-soft)] backdrop-blur">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <ArrowTopRightOnSquareIcon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">No matches yet</h3>
              <p className="mt-2 text-sm text-gray-500">
                Create or update a trip to surface encrypted companions that share your route.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {filteredMatches.map((match, index) => {
                const status = statusMeta[match.status] ?? statusMeta.pending;
                const isProcessingAccept = actionState?.id === match.id && actionState.action === 'accept';
                const isProcessingReject = actionState?.id === match.id && actionState.action === 'reject';

                return (
                  <motion.div
                    key={match.id}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.06 }}
                    className="group relative overflow-hidden rounded-[28px] border border-white/40 bg-white/85 p-6 shadow-[var(--shadow-soft)] backdrop-blur transition hover:-translate-y-1 hover:shadow-[var(--shadow-card)]"
                  >
                    <button
                      onClick={() => handleMatchClick(match)}
                      className="absolute inset-0"
                      aria-label={`View details for match ${match.id.slice(0, 8)}`}
                    />
                    <div className="pointer-events-none relative z-10 flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.35em] text-gray-500">
                          Match #{match.id.slice(0, 8)}
                        </p>
                        <h3 className="mt-2 text-lg font-semibold text-gray-900">
                          {match.proximity || 'Secure proximity'}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${status.dot}`} />
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${status.badge}`}>
                          {status.label}
                        </span>
                      </div>
                    </div>

                    <div className="relative z-10 mt-6 grid grid-cols-2 gap-4 text-sm">
                      <div className="rounded-2xl border border-white/40 bg-white/70 px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.35em] text-gray-400">Compatibility</p>
                        <p className="mt-1 text-2xl font-semibold text-primary">{match.matchScore}%</p>
                      </div>
                      <div className="rounded-2xl border border-white/40 bg-white/70 px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.35em] text-gray-400">Overlap</p>
                        <p className="mt-1 text-sm font-semibold text-gray-900">
                          Route {match.routeOverlap}% • Dates {match.dateOverlap} days
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/40 bg-white/70 px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.35em] text-gray-400">Interest similarity</p>
                        <p className="mt-1 text-sm font-semibold text-gray-900">
                          {Math.round(match.interestSimilarity * 100)}%
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/40 bg-white/70 px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.35em] text-gray-400">Matched on</p>
                        <p className="mt-1 text-sm font-semibold text-gray-900">{formatDate(match.createdAt)}</p>
                      </div>
                    </div>

                    {match.status === 'pending' ? (
                      <div className="relative z-10 mt-6 flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            handleRejectMatch(match.id);
                          }}
                          disabled={isProcessingReject}
                          className="inline-flex items-center justify-center gap-2 rounded-full border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-600 transition hover:border-gray-300 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isProcessingReject ? 'Rejecting…' : 'Pass for now'}
                        </button>
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            handleAcceptMatch(match.id);
                          }}
                          disabled={isProcessingAccept}
                          className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-primary-dark px-5 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-soft)] transition hover:shadow-[var(--shadow-card)] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isProcessingAccept ? 'Accepting…' : 'Accept match'}
                        </button>
                      </div>
                    ) : (
                      <div className="relative z-10 mt-6 text-xs text-gray-500">
                        Tap to review details, compatibility breakdown, and encrypted reveal options.
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

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
