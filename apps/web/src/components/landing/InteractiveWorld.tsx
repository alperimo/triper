'use client';

import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useEffect, useMemo, useRef } from 'react';

type Point = {
  x: number;
  y: number;
};

type Connection = {
  id: string;
  from: Point;
  to: Point;
  curvature?: number;
  delay?: number;
};

const continents = [
  {
    id: 'north-america',
    d: 'M140 210 C190 120 310 90 400 140 C450 170 460 240 420 280 C360 330 280 320 210 280 C170 260 150 240 140 210 Z',
  },
  {
    id: 'south-america',
    d: 'M360 320 C420 300 480 310 500 360 C520 410 500 470 450 520 C420 550 380 520 390 470 C400 420 360 360 360 320 Z',
  },
  {
    id: 'europe',
    d: 'M580 170 C620 120 700 90 780 120 C820 150 840 190 820 220 C790 260 720 250 660 240 C620 230 590 210 580 170 Z',
  },
  {
    id: 'africa',
    d: 'M620 250 C660 270 700 300 720 360 C740 420 720 490 660 520 C600 550 560 510 570 440 C580 370 580 300 620 250 Z',
  },
  {
    id: 'asia',
    d: 'M780 160 C860 120 940 130 1020 180 C1080 220 1100 280 1080 320 C1050 380 960 380 900 360 C860 350 820 320 800 280 C780 240 760 200 780 160 Z',
  },
  {
    id: 'australia',
    d: 'M930 360 C970 330 1060 340 1100 400 C1120 430 1110 470 1070 490 C1030 510 980 500 940 460 C920 440 910 400 930 360 Z',
  },
  {
    id: 'antarctica',
    d: 'M200 550 C340 530 520 520 720 530 C900 530 1040 540 1140 560 C900 610 560 610 260 580 C220 570 200 560 200 550 Z',
  },
];

const connections: Connection[] = [
  {
    id: 'na-eu',
    from: { x: 350, y: 220 },
    to: { x: 660, y: 210 },
    curvature: 0.28,
    delay: 0,
  },
  {
    id: 'na-sa',
    from: { x: 360, y: 260 },
    to: { x: 420, y: 360 },
    curvature: 0.18,
    delay: 0.15,
  },
  {
    id: 'eu-asia',
    from: { x: 720, y: 200 },
    to: { x: 940, y: 250 },
    curvature: 0.22,
    delay: 0.3,
  },
  {
    id: 'eu-africa',
    from: { x: 690, y: 230 },
    to: { x: 640, y: 320 },
    curvature: 0.16,
    delay: 0.45,
  },
  {
    id: 'africa-asia',
    from: { x: 680, y: 340 },
    to: { x: 900, y: 320 },
    curvature: -0.18,
    delay: 0.6,
  },
  {
    id: 'asia-australia',
    from: { x: 950, y: 320 },
    to: { x: 1010, y: 410 },
    curvature: 0.2,
    delay: 0.75,
  },
  {
    id: 'sa-africa',
    from: { x: 460, y: 400 },
    to: { x: 620, y: 420 },
    curvature: -0.12,
    delay: 0.9,
  },
];

const travelHubs: Array<Point & { id: string; label: string }> = [
  { id: 'lisbon', x: 640, y: 220, label: 'Lisbon' },
  { id: 'lagos', x: 650, y: 390, label: 'Lagos' },
  { id: 'singapore', x: 980, y: 360, label: 'Singapore' },
  { id: 'new-york', x: 360, y: 230, label: 'New York' },
  { id: 'buenos-aires', x: 460, y: 470, label: 'Buenos Aires' },
  { id: 'sydney', x: 1050, y: 450, label: 'Sydney' },
];

const buildArcPath = ({ from, to, curvature = 0.25 }: Connection) => {
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.sqrt(dx * dx + dy * dy) || 1;
  const normalX = (-dy / distance) * distance * curvature;
  const normalY = (dx / distance) * distance * curvature;
  const controlX = midX + normalX;
  const controlY = midY + normalY;

  return `M ${from.x} ${from.y} Q ${controlX} ${controlY} ${to.x} ${to.y}`;
};

type InteractiveWorldProps = {
  className?: string;
};

export function InteractiveWorld({ className }: InteractiveWorldProps = {}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pointerX = useMotionValue(0.5);
  const pointerY = useMotionValue(0.45);

  const glowX = useSpring(pointerX, { stiffness: 120, damping: 26, mass: 0.6 });
  const glowY = useSpring(pointerY, { stiffness: 120, damping: 26, mass: 0.6 });

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const handlePointerMove = (event: PointerEvent) => {
      const rect = element.getBoundingClientRect();
      const nextX = (event.clientX - rect.left) / rect.width;
      const nextY = (event.clientY - rect.top) / rect.height;
      pointerX.set(Math.min(Math.max(nextX, 0), 1));
      pointerY.set(Math.min(Math.max(nextY, 0), 1));
    };

    const resetPointer = () => {
      pointerX.set(0.5);
      pointerY.set(0.45);
    };

    element.addEventListener('pointermove', handlePointerMove);
    element.addEventListener('pointerleave', resetPointer);

    return () => {
      element.removeEventListener('pointermove', handlePointerMove);
      element.removeEventListener('pointerleave', resetPointer);
    };
  }, [pointerX, pointerY]);

  const glowXPercent = useTransform(glowX, (value) => `${value * 100}%`);
  const glowYPercent = useTransform(glowY, (value) => `${value * 100}%`);

  const parallaxX = useTransform(glowX, (value) => `${(value - 0.5) * 60}px`);
  const parallaxY = useTransform(glowY, (value) => `${(value - 0.5) * 40}px`);
  const tiltX = useTransform(glowY, (value) => `${(0.5 - value) * 8}deg`);
  const tiltY = useTransform(glowX, (value) => `${(value - 0.5) * 10}deg`);

  const sceneTransform = useMotionTemplate`translate3d(${parallaxX}, ${parallaxY}, 0) rotateX(${tiltX}) rotateY(${tiltY})`;
  const highlightGradient = useMotionTemplate`radial-gradient(820px circle at ${glowXPercent} ${glowYPercent}, rgba(107, 142, 35, 0.28), transparent 70%)`;
  const horizonGlow = useMotionTemplate`radial-gradient(980px circle at ${glowXPercent} ${glowYPercent}, rgba(59, 130, 246, 0.25), transparent 78%)`;

  const connectionPaths = useMemo(
    () =>
      connections.map((connection) => ({
        ...connection,
        path: buildArcPath(connection),
      })),
    [],
  );

  const containerClassName = [
    'relative h-full w-full overflow-hidden rounded-[44px] bg-gradient-to-br from-white/10 via-white/5 to-white/0',
  ];
  if (className) containerClassName.push(className);

  return (
    <div ref={containerRef} className={containerClassName.join(' ')}>
      <motion.div aria-hidden className="absolute inset-0 mix-blend-screen" style={{ backgroundImage: highlightGradient }} />
      <motion.div aria-hidden className="absolute inset-0 mix-blend-screen" style={{ backgroundImage: horizonGlow }} />
      <div className="absolute inset-0 bg-gradient-to-b from-white/75 via-white/20 to-transparent opacity-70" aria-hidden />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -top-36 left-[10%] h-[420px] w-[420px] rounded-full bg-primary/30 blur-[160px]"
        animate={{ opacity: [0.4, 0.7, 0.4], scale: [1, 1.12, 1] }}
        transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 right-[8%] h-[520px] w-[520px] rounded-full bg-sky-400/30 blur-[180px]"
        animate={{ opacity: [0.35, 0.6, 0.35], scale: [1.05, 1.18, 1.05] }}
        transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
      />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center [perspective:1800px]">
        <motion.svg
          width="1200"
          height="600"
          viewBox="0 40 1200 600"
          preserveAspectRatio="xMidYMid slice"
          className="h-[120%] w-[120%] text-primary"
          style={{ transform: sceneTransform }}
          aria-hidden
        >
          <defs>
            <linearGradient id="continent-fill" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="rgba(107, 142, 35, 0.18)" />
              <stop offset="55%" stopColor="rgba(107, 142, 35, 0.08)" />
              <stop offset="100%" stopColor="rgba(107, 142, 35, 0.12)" />
            </linearGradient>
            <radialGradient id="continent-glow" cx="50%" cy="45%" r="60%">
              <stop offset="0%" stopColor="rgba(255, 255, 255, 0.45)" />
              <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
            </radialGradient>
            <linearGradient id="connection-stroke" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(107, 142, 35, 0.8)" />
              <stop offset="100%" stopColor="rgba(59, 130, 246, 0.75)" />
            </linearGradient>
            <radialGradient id="hub-pulse" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(255, 255, 255, 0.7)" />
              <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
            </radialGradient>
          </defs>

          <g opacity="0.9">
            {continents.map((continent) => (
              <motion.path
                key={continent.id}
                d={continent.d}
                fill="url(#continent-fill)"
                stroke="rgba(255, 255, 255, 0.4)"
                strokeWidth={2}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              />
            ))}
          </g>

          <motion.circle
            cx="600"
            cy="250"
            r="220"
            fill="url(#continent-glow)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.45 }}
            transition={{ duration: 1.2, delay: 0.2 }}
          />

          {connectionPaths.map((connection) => (
            <motion.path
              key={`${connection.id}-shadow`}
              d={connection.path}
              stroke="rgba(15, 23, 42, 0.1)"
              strokeWidth={10}
              strokeLinecap="round"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.2, delay: connection.delay ?? 0.1, ease: 'easeInOut' }}
            />
          ))}

          {connectionPaths.map((connection) => (
            <motion.path
              key={connection.id}
              d={connection.path}
              stroke="url(#connection-stroke)"
              strokeWidth={4}
              strokeLinecap="round"
              strokeDasharray="16 18"
              strokeDashoffset={0}
              fill="none"
              animate={{ strokeDashoffset: [-180, 0] }}
              transition={{ repeat: Infinity, duration: 6, ease: 'linear', delay: connection.delay ?? 0 }}
            />
          ))}

          {travelHubs.map((hub) => (
            <g key={hub.id}>
              <motion.circle
                cx={hub.x}
                cy={hub.y}
                r={16}
                fill="rgba(255, 255, 255, 0.8)"
                stroke="rgba(107, 142, 35, 0.6)"
                strokeWidth={3}
                initial={{ opacity: 0, scale: 0.4 }}
                animate={{ opacity: 1, scale: [1, 1.08, 1] }}
                transition={{ duration: 0.9, delay: 0.5, repeat: Infinity, repeatDelay: 2.6 }}
              />
              <motion.circle
                cx={hub.x}
                cy={hub.y}
                r={32}
                fill="url(#hub-pulse)"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.08, 0.22, 0], r: [32, 58, 70] }}
                transition={{ duration: 4.8, repeat: Infinity, repeatDelay: 2, delay: 1.2 }}
              />
            </g>
          ))}
        </motion.svg>
      </div>

      <div className="pointer-events-none absolute inset-0">
        <motion.div
          className="absolute left-[12%] top-[16%] w-48 rounded-3xl border border-white/40 bg-white/80 p-4 text-xs font-medium text-gray-700 shadow-[0_25px_55px_-25px_rgba(15,23,42,0.45)] backdrop-blur"
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.6, ease: 'easeOut' }}
        >
          <p className="text-[10px] uppercase tracking-[0.35em] text-primary">Privacy mesh</p>
          <p className="mt-2 text-sm font-semibold text-gray-900">Encrypted routes synced.</p>
          <p className="mt-1 text-[11px] text-gray-500">No coordinates ever leave the enclave.</p>
        </motion.div>

        <motion.div
          className="absolute right-[14%] top-[26%] w-52 rounded-3xl border border-white/50 bg-white/80 p-4 text-xs font-medium text-gray-700 shadow-[0_20px_50px_-25px_rgba(30,41,59,0.45)] backdrop-blur"
          initial={{ opacity: 0, y: 20, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.85, duration: 0.6, ease: 'easeOut' }}
        >
          <p className="text-[10px] uppercase tracking-[0.35em] text-sky-500">Live matches</p>
          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="font-semibold text-gray-900">Route resonance</span>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] text-primary">92%</span>
          </div>
          <p className="mt-1 text-[11px] text-gray-500">3 companion candidates within your privacy radius.</p>
        </motion.div>

        <motion.div
          className="absolute bottom-[14%] left-1/2 w-60 -translate-x-1/2 rounded-full border border-white/40 bg-gradient-to-r from-primary/85 to-primary-hover/75 px-5 py-3 text-xs text-white shadow-[0_20px_60px_-15px_rgba(76,175,80,0.55)] backdrop-blur"
          initial={{ opacity: 0, y: 16, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 1, duration: 0.6, ease: 'easeOut' }}
        >
          <div className="flex items-center justify-between font-semibold">
            <span>Secure MPC tunnel</span>
            <motion.span
              className="inline-flex h-2.5 w-2.5 rounded-full bg-white"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
            />
          </div>
          <p className="mt-1 text-[11px] text-white/70">Handshake verified • zero-knowledge handshake complete.</p>
        </motion.div>
      </div>
    </div>
  );
}
