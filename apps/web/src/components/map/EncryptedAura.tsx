'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface EncryptedAuraProps {
  position: [number, number]; // [lng, lat]
  matchScore: number; // 0-100
  distance: string; // "2-5km"
  onClick: () => void;
}

export function EncryptedAura({ position, matchScore, distance, onClick }: EncryptedAuraProps) {
  const [pulse, setPulse] = useState(false);
  
  // Pulse animation when match score is high
  useEffect(() => {
    if (matchScore > 70) {
      const interval = setInterval(() => setPulse(p => !p), 2000);
      return () => clearInterval(interval);
    }
  }, [matchScore]);
  
  // Color based on match score
  const getColor = (score: number) => {
    if (score > 80) return { bg: 'rgba(34, 197, 94, 0.3)', border: '#22c55e' }; // Green
    if (score > 60) return { bg: 'rgba(59, 130, 246, 0.3)', border: '#3b82f6' }; // Blue
    return { bg: 'rgba(156, 163, 175, 0.2)', border: '#9ca3af' }; // Gray
  };
  
  const colors = getColor(matchScore);
  
  return (
    <motion.div
      className="absolute cursor-pointer z-10"
      style={{
        left: `${position[0]}px`,
        top: `${position[1]}px`,
        transform: 'translate(-50%, -50%)',
      }}
      onClick={onClick}
      whileHover={{ scale: 1.2 }}
      animate={{
        scale: pulse ? [1, 1.1, 1] : 1,
      }}
      transition={{ duration: 2 }}
    >
      {/* Outer glow */}
      <div
        className="absolute inset-0 rounded-full blur-2xl"
        style={{
          width: '100px',
          height: '100px',
          background: `radial-gradient(circle, ${colors.bg} 0%, transparent 70%)`,
        }}
      />
      
      {/* Middle ring */}
      <div
        className="absolute inset-0 rounded-full blur-md"
        style={{
          width: '60px',
          height: '60px',
          margin: '20px',
          background: `radial-gradient(circle, ${colors.bg} 0%, transparent 60%)`,
        }}
      />
      
      {/* Inner core */}
      <div
        className="relative w-14 h-14 rounded-full backdrop-blur-sm flex flex-col items-center justify-center"
        style={{
          background: colors.bg,
          border: `2px solid ${colors.border}`,
          margin: '23px',
        }}
      >
        <span className="text-white text-xs font-bold">
          {matchScore}%
        </span>
        <span className="text-white/70 text-[10px]">
          {distance}
        </span>
      </div>
      
      {/* Encrypted indicator */}
      <div className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
        </svg>
      </div>
    </motion.div>
  );
}
