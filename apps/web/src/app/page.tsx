'use client';

import { WalletButton } from '@/components/wallet/WalletButton';
import { useUserStore } from '@/lib/store/user';
import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  ShieldCheckIcon,
  SparklesIcon,
  GlobeAltIcon,
  ArrowRightIcon,
  LockClosedIcon,
  ArrowsRightLeftIcon,
} from '@heroicons/react/24/outline';

const featureHighlights = [
  {
    title: 'Encrypted Location Graph',
    description:
      'Elite-grade MPC keeps every waypoint private while still letting you discover overlapping journeys.',
    icon: ShieldCheckIcon,
    stat: 'Zero-knowledge validated',
  },
  {
    title: 'Adaptive Travel Matching',
    description:
      'We blend proximity, travel styles, interests, and timing to surface companions you actually want to meet.',
    icon: GlobeAltIcon,
    stat: '92% relevancy in pilot',
  },
  {
    title: 'Instant Trust Signals',
    description:
      'Compatibility scores, encrypted references, and on-chain reputation make collaboration effortless.',
    icon: SparklesIcon,
    stat: 'MPC verified credentials',
  },
];

const workflowSteps = [
  {
    title: 'Plot Your Route',
    description: 'Drop encrypted waypoints, set travel windows, and choose how precise you want to be.',
  },
  {
    title: 'Secure Computation',
    description: 'Arcium MPC aligns your plans with others without any location ever leaving your device.',
  },
  {
    title: 'Preview Matches',
    description: 'Review private compatibility profiles, proximity bands, and shared interests.',
  },
  {
    title: 'Mutual Reveal',
    description: 'Accept to unlock full itineraries, contact details, and private group coordination.',
  },
];

const faqItems = [
  {
    question: 'How private is my travel data?',
    answer:
      'Every route is split into encrypted shards before computation. We only share obfuscated heatmaps until you mutually opt to reveal.',
  },
  {
    question: 'Do I need to be crypto-native?',
    answer:
      'No jargon, no wallets required to explore. Connect Solana only when you are ready to match and anchor your reputation on-chain.',
  },
  {
    question: 'What if I change my plans?',
    answer:
      'Update your trip at any time. Triper re-computes matches in real time and instantly withdraws details you previously revealed.',
  },
];

export default function Home() {
  const { isConnected } = useUserStore();
  const router = useRouter();

  // Redirect to dashboard if wallet is connected
  useEffect(() => {
    if (isConnected) {
      router.push('/map');
    }
  }, [isConnected, router]);

  if (isConnected) {
    // Show loading while redirecting
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-gray-600">Redirecting to your encrypted dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-y-0 left-[-10%] w-[55%] bg-[radial-gradient(circle_at_top,rgba(107,142,35,0.25),transparent_65%)] blur-3xl" />
        <div className="absolute bottom-[-20%] right-[-5%] w-[45%] h-[60%] bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.18),transparent_55%)] blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-white/60 to-transparent" />
      </div>

      <header className="relative z-30">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative h-12 w-12">
              <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-md" />
              <Image src="/logo.svg" alt="Triper Logo" fill className="relative rounded-2xl object-contain" />
            </div>
            <div className="leading-tight">
              <span className="text-sm uppercase tracking-[0.35em] text-gray-500">Triper</span>
              <p className="text-lg font-semibold text-gray-900">Travel Privately Together</p>
            </div>
          </Link>

          <nav className="flex items-center gap-2 rounded-full border border-white/40 bg-white/70 px-4 py-2 text-sm font-medium shadow-[var(--shadow-soft)] backdrop-blur-lg">
            <Link href="#features" className="rounded-full px-3 py-1 text-gray-600 transition hover:text-gray-900">
              Features
            </Link>
            <Link href="#how-it-works" className="rounded-full px-3 py-1 text-gray-600 transition hover:text-gray-900">
              How it works
            </Link>
            <Link href="#faq" className="rounded-full px-3 py-1 text-gray-600 transition hover:text-gray-900">
              FAQ
            </Link>
            <Link href="/map" className="rounded-full px-3 py-1 text-gray-600 transition hover:text-gray-900">
              Dashboard
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="#how-it-works"
              className="hidden rounded-full border border-primary/20 px-4 py-2 text-sm font-medium text-primary transition hover:border-primary hover:bg-primary/10 lg:inline-flex"
            >
              Explore the flow
            </Link>

          </div>
        </div>
      </header>

      <main className="relative z-20 pb-32">
        <section className="mx-auto flex min-h-[70vh] max-w-6xl flex-col gap-16 px-6 pt-12 lg:flex-row lg:items-center lg:pt-16">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="flex-1 space-y-8"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-medium text-gray-600 shadow-[var(--shadow-soft)] backdrop-blur">
              <LockClosedIcon className="h-4 w-4 text-primary" />
              <span>Private-by-default travel coordination</span>
            </div>
            <h1 className="text-5xl leading-tight text-gray-900 sm:text-6xl">
              Find your <span className="text-primary">ideal travel companions</span> without compromising your location.
            </h1>
            <p className="max-w-xl text-lg text-gray-600">
              Triper is the encrypted social layer for explorers. Plan routes, surface high-intent matches, and unlock details only when you
              both feel ready.
            </p>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3 rounded-full bg-gradient-to-r from-primary to-primary-hover px-6 py-3 text-sm font-semibold text-white shadow-[var(--shadow-soft)]">
                <WalletButton />
              </div>
              <Link
                href="#features"
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-6 py-3 text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:text-gray-900"
              >
                See what makes Triper different
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-6">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-gray-500">Trusted pilots</p>
                <p className="text-lg font-semibold text-gray-900">MPC Labs • Arcium • Solana Voyager Guild</p>
              </div>
              <div className="h-12 w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent" />
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-gray-500">Match time</p>
                <p className="text-lg font-semibold text-gray-900">Under 12 seconds end-to-end</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 48 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
            className="relative flex-1"
          >
            <div className="absolute inset-0 -z-10 rounded-[40px] bg-gradient-to-br from-primary/30 via-emerald-200/40 to-white blur-3xl" />
            <div className="relative overflow-hidden rounded-[32px] border border-white/40 bg-white/80 shadow-[var(--shadow-card)] backdrop-blur-xl">
              <div className="flex flex-col gap-8 p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-gray-500">Live route preview</p>
                    <p className="text-xl font-semibold text-gray-900">Encrypted match radius</p>
                  </div>
                  <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">Private</div>
                </div>
                <div className="space-y-5">
                  {['Lisbon → Porto', 'Porto → Vigo', 'Vigo → Santiago'].map((leg, index) => (
                    <div key={leg} className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white/60 px-4 py-3 shadow-sm">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/15 text-sm font-semibold text-primary">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{leg}</p>
                        <p className="text-xs text-gray-500">Visibility: encrypted cell ±12km</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="rounded-2xl border border-white/50 bg-white/85 px-4 py-4 text-sm font-medium text-primary shadow-[var(--shadow-soft)]">
                  🔐 MPC running — compatibility match 88% with 3 travelers on similar routes.
                </div>
              </div>
            </div>

            <div className="absolute -bottom-20 -right-6 w-48 rounded-3xl border border-white/40 bg-white/80 p-5 text-sm text-gray-700 shadow-[var(--shadow-soft)] backdrop-blur-xl">
              <div className="mb-2 flex items-center justify-between text-xs text-gray-500">
                <span>Assurance</span>
                <span className="text-green-500">High</span>
              </div>
              <p className="font-semibold text-gray-900">Zero-knowledge proof complete.</p>
              <p className="mt-1 text-xs text-gray-500">Your coordinates never leave the enclave.</p>
            </div>
          </motion.div>
        </section>

        <section id="features" className="mx-auto max-w-6xl px-6 py-24">
          <div className="mb-12 flex flex-col gap-4 text-left sm:text-center">
            <motion.span
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.4 }}
              className="mx-auto inline-flex items-center gap-2 rounded-full border border-primary/25 bg-white/85 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-primary shadow-[var(--shadow-soft)]"
            >
              Capabilities
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.6 }}
              className="text-3xl text-gray-900 sm:text-4xl"
            >
              Built for travelers who care about privacy, chemistry, and control.
            </motion.h2>
            <p className="mx-auto max-w-2xl text-base text-gray-600">
              Every interaction runs through encrypted compute, giving you human-grade insights without exposure. It is the secure layer
              your group trips and solo adventures have been missing.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {featureHighlights.map((feature) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.45 }}
                className="group relative overflow-hidden rounded-[26px] border border-white/40 bg-white/80 p-6 shadow-[var(--shadow-soft)] backdrop-blur-lg transition hover:-translate-y-1 hover:shadow-[var(--shadow-card)]"
              >
                <div className="absolute inset-0 opacity-0 transition group-hover:opacity-100">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5" />
                </div>
                <feature.icon className="relative h-10 w-10 text-primary" />
                <h3 className="relative mt-4 text-xl font-semibold text-gray-900">{feature.title}</h3>
                <p className="relative mt-3 text-sm text-gray-600">{feature.description}</p>
                <p className="relative mt-6 inline-flex rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
                  {feature.stat}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="mx-auto max-w-6xl px-6 py-24">
          <div className="flex flex-col gap-4 text-left sm:text-center">
            <motion.span
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4 }}
              className="mx-auto inline-flex items-center gap-2 rounded-full border border-primary/25 bg-white/85 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-primary shadow-[var(--shadow-soft)]"
            >
              Flow
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.6 }}
              className="text-3xl text-gray-900 sm:text-4xl"
            >
              From plotting a route to coordinating the trip in minutes.
            </motion.h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {workflowSteps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.45, delay: index * 0.05 }}
                className="relative rounded-[26px] border border-gray-100 bg-white/80 p-6 shadow-[var(--shadow-soft)] backdrop-blur"
              >
                <div className="absolute inset-x-6 -top-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-dark text-lg font-semibold text-white shadow-[var(--shadow-soft)]">
                  {index + 1}
                </div>
                <div className="pt-6">
                  <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
                  <p className="mt-3 text-sm text-gray-600">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-6 rounded-[32px] border border-white/50 bg-white/85 px-8 py-10 text-center shadow-[var(--shadow-soft)] backdrop-blur md:flex-row md:text-left">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.35em] text-primary">Encrypted matchmaking</p>
              <h3 className="text-2xl font-semibold text-gray-900">
                3x faster matches with zero location leakage — powered by Arcium MPC.
              </h3>
            </div>
            <Link
              href="/map"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-primary-hover px-6 py-3 text-sm font-semibold text-white shadow-[var(--shadow-soft)] transition hover:shadow-[var(--shadow-card)]"
            >
              Launch the planner
              <ArrowsRightLeftIcon className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <section id="faq" className="mx-auto max-w-5xl px-6 py-24">
          <div className="mb-10 flex flex-col gap-3 text-left sm:text-center">
            <h2 className="text-3xl text-gray-900 sm:text-4xl">Questions we get all the time.</h2>
            <p className="text-base text-gray-600">
              Privacy, accessibility, and control are core to Triper. Here is how we deliver on every front.
            </p>
          </div>
          <div className="space-y-4">
            {faqItems.map((item) => (
              <details
                key={item.question}
                className="group overflow-hidden rounded-[26px] border border-white/40 bg-white/70 p-6 shadow-[var(--shadow-soft)] backdrop-blur transition"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold text-gray-900">
                  <span>{item.question}</span>
                  <span className="text-primary transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-4 text-sm text-gray-600 transition group-open:text-gray-700">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <footer className="relative z-20 border-t border-white/40 bg-white/70">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 text-sm text-gray-500 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Triper. Built for explorers, powered by encrypted compute.</p>
          <div className="flex items-center gap-4">
            <Link href="#features" className="hover:text-gray-800">
              Product
            </Link>
            <Link href="#faq" className="hover:text-gray-800">
              Privacy
            </Link>
            <Link href="mailto:hi@triper.xyz" className="hover:text-gray-800">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
