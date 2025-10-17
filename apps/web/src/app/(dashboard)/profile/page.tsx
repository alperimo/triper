'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useUserStore } from '@/lib/store/user';
import { useTripStore } from '@/lib/store/trip';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  MapIcon,
  ArrowUpRightIcon,
  ShieldCheckIcon,
  SparklesIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

const travelPreferences = [
  { label: 'Solo-friendly companions', value: 'solo' },
  { label: 'Slow travel pace', value: 'slow' },
  { label: 'Cafés & co-working', value: 'cowork' },
  { label: 'Weekend getaways', value: 'weekend' },
];

export default function ProfilePage() {
  const { publicKey } = useUserStore();
  const { disconnect: disconnectWallet } = useWallet();
  const { myTrips: trips } = useTripStore();

  const truncateAddress = (address: string) => `${address.slice(0, 4)}...${address.slice(-4)}`;

  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="mx-auto max-w-6xl space-y-10 px-6 py-10">
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative overflow-hidden rounded-[40px] border border-white/40 bg-gradient-to-br from-primary/15 via-white to-emerald-100/30 px-8 py-10 shadow-[var(--shadow-card)] backdrop-blur"
        >
          <div className="absolute -top-24 right-0 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-primary">Profile</p>
              <h1 className="mt-2 text-3xl font-semibold text-gray-900">Your encrypted identity</h1>
              <p className="mt-3 max-w-xl text-sm text-gray-600">
                Anchor your reputation, manage your routes, and control what you reveal. Triper keeps your location private until you give
                the green light.
              </p>
              <div className="mt-6 inline-flex items-center gap-3 rounded-full border border-white/40 bg-white/70 px-5 py-2 text-xs font-semibold text-gray-600 shadow-[var(--shadow-soft)] backdrop-blur">
                <ShieldCheckIcon className="h-4 w-4 text-primary" />
                Privacy level: Maximum — matches only see compatibility until mutual reveal.
              </div>
            </div>
            <div className="flex flex-col items-start gap-3 md:items-end">
              <div className="rounded-full border border-white/60 bg-white/80 px-4 py-2 text-sm font-mono text-gray-700 shadow-sm">
                {publicKey ? truncateAddress(publicKey) : 'Wallet not connected'}
              </div>
              <button
                onClick={() => disconnectWallet()}
                className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-white/70 px-4 py-2 text-sm font-semibold text-red-500 transition hover:border-red-300 hover:bg-red-50"
              >
                Disconnect wallet
              </button>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="grid gap-4 md:grid-cols-3"
        >
          {[
            {
              label: 'Active trips',
              value: trips.length,
              description: 'Routes currently in encrypted matching.',
            },
            {
              label: 'Total matches',
              value: 0,
              description: 'Mutual matches unlocked in the last 30 days.',
            },
            {
              label: 'Connections',
              value: 0,
              description: 'Trusted travellers you have revealed to.',
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-[28px] border border-white/50 bg-white/80 px-6 py-6 shadow-[var(--shadow-soft)] backdrop-blur"
            >
              <p className="text-xs uppercase tracking-[0.35em] text-gray-400">{stat.label}</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">{stat.value}</p>
              <p className="mt-1 text-xs text-gray-500">{stat.description}</p>
            </div>
          ))}
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="grid gap-6 lg:grid-cols-2"
        >
          <div className="rounded-[32px] border border-white/40 bg-white/80 px-6 py-6 shadow-[var(--shadow-soft)] backdrop-blur">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Cog6ToothIcon className="h-5 w-5 text-primary" />
              Travel preferences
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Calibrate how Triper matches you. Preferences stay encrypted until you mutually reveal.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              {travelPreferences.map((pref) => (
                <span
                  key={pref.value}
                  className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-xs font-semibold text-primary shadow-sm"
                >
                  <SparklesIcon className="h-4 w-4" />
                  {pref.label}
                </span>
              ))}
            </div>
            <div className="mt-6 text-xs text-gray-500">
              Preferences editing coming soon — sync your travel style, accessibility needs, and budget to sharpen encrypted matches.
            </div>
          </div>

          <div className="rounded-[32px] border border-white/40 bg-white/80 px-6 py-6 shadow-[var(--shadow-soft)] backdrop-blur">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <SparklesIcon className="h-5 w-5 text-primary" />
              Privacy guarantees
            </div>
            <ul className="mt-4 space-y-3 text-sm text-gray-600">
              <li>🔐 Routes encrypted with Arcium MPC — no plaintext data leaves your device.</li>
              <li>🛰️ Locations fuzzed to H3 cells until mutual reveal.</li>
              <li>🪪 Contact details shared only after both parties accept.</li>
              <li>🧾 Full audit trail available post-reveal for peace of mind.</li>
            </ul>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="rounded-[32px] border border-white/40 bg-white/80 px-6 py-6 shadow-[var(--shadow-soft)] backdrop-blur"
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Your trips</h2>
              <p className="text-sm text-gray-500">Encrypted itineraries currently in the matching graph.</p>
            </div>
            <Link
              href="/map"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-primary-dark px-5 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-soft)] transition hover:shadow-[var(--shadow-card)]"
            >
              <MapIcon className="h-5 w-5" />
              Plan another route
            </Link>
          </div>

          {trips.length === 0 ? (
            <div className="mt-6 rounded-[28px] border border-dashed border-primary/30 bg-white/70 px-6 py-12 text-center shadow-[var(--shadow-soft)]">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <MapIcon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">No trips yet</h3>
              <p className="mt-2 text-sm text-gray-500">
                Create your first route to start surfacing compatible travellers. Your coordinates stay encrypted end-to-end.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {trips.map((trip, index) => (
                <motion.div
                  key={trip.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative overflow-hidden rounded-[28px] border border-white/50 bg-white/85 px-5 py-5 shadow-[var(--shadow-soft)] backdrop-blur"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-emerald-100/20 opacity-0 transition group-hover:opacity-100" />
                  <div className="relative flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-900">Trip #{trip.id.slice(0, 8)}</h3>
                      <span className="inline-flex items-center gap-1 rounded-full border border-primary/10 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.35em] text-primary">
                        Encrypted
                      </span>
                    </div>
                    <div className="space-y-2 text-xs text-gray-500">
                      <div className="flex items-center gap-2">
                        <ArrowUpRightIcon className="h-4 w-4 text-primary" />
                        {new Date(trip.startDate).toLocaleDateString()} – {new Date(trip.endDate).toLocaleDateString()}
                      </div>
                      <div>Mode: {trip.travelStyle || 'Unspecified'}</div>
                      <div>Waypoints stored privately via MPC nodes.</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>
      </div>
    </div>
  );
}
