'use client';

import { InteractiveWorld } from '@/components/landing/InteractiveWorld';
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
    title: 'Private Route Builder',
    description:
      'Create detailed routes, set date windows, and control waypoint precision — all end-to-end encrypted.',
    icon: ShieldCheckIcon,
    stat: 'Route data locked in MPC',
  },
  {
    title: 'Interest-Driven Matching',
    description:
      'Tell Triper what you love — from food tours to trail runs — knowing every interest stays encrypted on your device.',
    icon: GlobeAltIcon,
    stat: 'Client-side encryption',
  },
  {
    title: 'Meaningful Match Scores',
    description:
      'See route overlap and interest alignment scores that explain every suggestion before you decide to connect.',
    icon: SparklesIcon,
    stat: 'Scores on secret data',
  },
];

const workflowSteps = [
  {
    title: 'Create Your Route',
    description: 'Add legs, choose the dates between each stop, and adjust privacy for every waypoint with our open map.',
  },
  {
    title: 'Set Your Interests',
    description: 'Pick the interests, travel styles, and comfort levels that matter to you; we encrypt everything as soon as you save.',
  },
  {
    title: 'Encrypted Matchmaking',
    description: 'Arcium MPC compares routes and interests inside its secure supercomputer and returns route and interest scores only.',
  },
  {
    title: 'Consent & Connect',
    description: 'Accept when the scores feel right. Only then do both travelers unlock each other’s routes and interest details.',
  },
];

const faqItems = [
  {
    question: 'What does privacy-first matching mean for me?',
    answer:
      'Your routes, dates, and interests are encrypted on your device before they ever leave your screen. Matching happens on Arcium MPC, so no one — including Triper — sees your exact data.',
  },
  {
    question: 'Can I tweak my plans later?',
    answer: 'Absolutely. Update a leg, change a date window, or refresh your interests whenever you like and Triper recomputes the scores instantly.',
  },
  {
    question: 'When do other travelers see my details?',
    answer:
      'Only after both sides accept a match. Until then, travelers see anonymized route and interest scores — never your exact itinerary or profile.',
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
    <div className="relative min-h-screen overflow-x-hidden bg-white">
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-y-0 left-[-10%] w-[55%] bg-[radial-gradient(circle_at_top,rgba(107,142,35,0.12),transparent_70%)] blur-3xl" />
        <div className="absolute bottom-[-20%] right-[-5%] w-[45%] h-[60%] bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.08),transparent_60%)] blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-br from-white via-white/95 to-white/90" />
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
          </nav>

        </div>
      </header>

      <main className="relative z-20 pb-32">
        <section className="relative isolate min-h-screen overflow-hidden px-4 pt-6 sm:px-6 sm:pt-10 lg:px-8">
          <div className="absolute inset-0">
            <InteractiveWorld className="rounded-none" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-white via-white/70 to-transparent" aria-hidden />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-white via-white/60 to-transparent" aria-hidden />
          </div>

          <div className="relative z-10 mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-end pb-8 text-center sm:pb-12">
            <motion.div
              initial={{ opacity: 0, y: 36 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut', delay: 0.25 }}
              className="pointer-events-none flex w-full flex-col items-center gap-6"
            >
              <div className="pointer-events-auto flex w-full max-w-xl flex-col items-center gap-5 rounded-[32px] border border-white/50 bg-white/60 px-6 py-7 text-center shadow-[var(--shadow-soft)] backdrop-blur-xl">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.38em] text-primary">
                  <LockClosedIcon className="h-4 w-4 text-primary" />
                  <span className="text-gray-600">Encrypted by design</span>
                </div>
                <h1 className="text-3xl font-semibold leading-tight text-gray-900 sm:text-4xl lg:text-5xl">
                  Journey together, stay private.
                </h1>
                <p className="max-w-2xl text-sm text-gray-600 sm:text-base">
                  Find your perfect travel companions on an interactive world map — while keeping your exact plans and interests completely private.
                </p>
                <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
                  <div className="flex items-center justify-center rounded-full bg-gradient-to-r from-primary to-primary-hover px-6 py-3 text-sm font-semibold text-white shadow-[var(--shadow-soft)]">
                    <WalletButton />
                  </div>
                  <Link
                    href="#features"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-white/70 bg-white/60 px-6 py-3 text-sm font-semibold text-gray-700 transition hover:border-white/90 hover:text-gray-900"
                  >
                    Explore the experience
                    <ArrowRightIcon className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pt-16 sm:pt-20">
          <div className="grid gap-12 lg:grid-cols-[1.05fr_minmax(0,0.95fr)] lg:items-center">
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="space-y-6"
            >
              <div className="inline-flex items-center gap-2 rounded-full bg-white/85 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-primary shadow-[var(--shadow-soft)] backdrop-blur">
                Private route builder
              </div>
              <h2 className="text-4xl text-gray-900 sm:text-5xl">
                Find your <span className="text-primary">ideal travel companions</span> without exposing your itinerary.
              </h2>
              <p className="text-base text-gray-600 sm:text-lg">
                Triper is the privacy-first travel companion matcher built on Solana using Arcium's supercomputer. Plot flexible routes, set per-leg dates,
                declare your interests, and receive interpretive compatibility scores — long before your travel partners see your exact path.
              </p>
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[var(--shadow-soft)] backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.35em] text-gray-500">Safe & Private</p>
                  <p className="mt-2 text-sm text-gray-600">Your exact locations stay encrypted. Only you decide when and what to reveal to potential companions.</p>
                </div>
                <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[var(--shadow-soft)] backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.35em] text-gray-500">Smart Compatibility</p>
                  <p className="mt-2 text-sm text-gray-600">Get clear scores showing route overlap and interest alignment — so you connect with the right travelers.</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 36 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
              className="relative"
            >
              <div className="absolute inset-0 -z-10 rounded-[44px] bg-gradient-to-br from-primary/20 via-emerald-200/30 to-white blur-3xl" />
              <div className="relative overflow-hidden rounded-[36px] border border-white/60 bg-white/80 shadow-[var(--shadow-card)] backdrop-blur-xl">
                <div className="flex flex-col gap-7 p-8">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em] text-gray-500">Live route preview</p>
                      <p className="text-xl font-semibold text-gray-900">Your Private Journey</p>
                    </div>
                    <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">Private</div>
                  </div>
                  <div className="space-y-5">
                    {['Lisbon → Porto', 'Porto → Vigo', 'Vigo → Santiago'].map((leg, index) => (
                      <div key={leg} className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white/70 px-4 py-3 shadow-sm">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/15 text-sm font-semibold text-primary">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{leg}</p>
                          <p className="text-xs text-gray-500">Visibility: Private</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-2xl border border-white/60 bg-white/85 px-4 py-4 text-sm font-medium text-primary shadow-[var(--shadow-soft)]">
                    🔐 Matching in progress — 88% compatibility with 3 travelers on similar routes.
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-20 -right-6 w-48 rounded-3xl border border-white/70 bg-white/90 p-5 text-sm text-gray-700 shadow-[0_25px_70px_-5px_rgba(0,0,0,0.25),0_10px_30px_-10px_rgba(0,0,0,0.2)] backdrop-blur-xl">
                <div className="mb-2 flex items-center justify-between text-xs text-gray-500">
                  <span>Security</span>
                  <span className="text-green-500">High</span>
                </div>
                <p className="font-semibold text-gray-900">Fully encrypted and secure.</p>
                <p className="mt-1 text-xs text-gray-500">Your exact locations stay completely private.</p>
              </div>
            </motion.div>
          </div>
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
              Every route, date, and interest is encrypted client-side, and matching happens on secret data inside Arcium MPC. Even our open-source
              map layer keeps your journey private — no external APIs, no data brokers.
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
                Get route overlap and interest alignment scores in seconds.
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
          <p>© {new Date().getFullYear()} Triper. Built for explorers.</p>
          <div className="flex items-center gap-4">
            {/* <Link href="#features" className="hover:text-gray-800">
              Product
            </Link>
            <Link href="#faq" className="hover:text-gray-800">
              Privacy
            </Link> */}
            <Link href="mailto:contact@triperapp.xyz" className="hover:text-gray-800">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
