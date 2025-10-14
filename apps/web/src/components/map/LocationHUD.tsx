/**
 * LocationHUD - Top HUD widget showing selected location
 * 
 * Features:
 * - Shows selected location from search
 * - Click to navigate map to location
 * - Allows precise pin placement
 * - Stretches across top of map
 */

'use client';

import React from 'react';
import { MapPinIcon, XMarkIcon, ArrowsPointingOutIcon } from '@heroicons/react/24/outline';

interface LocationHUDProps {
  location: {
    name: string;
    address: string;
    lat: number;
    lng: number;
  } | null;
  onNavigate: () => void;
  onClose: () => void;
  onConfirm?: () => void;
  className?: string;
}

export function LocationHUD({ 
  location, 
  onNavigate, 
  onClose,
  onConfirm,
  className = '' 
}: LocationHUDProps) {
  if (!location) return null;

  return (
    <div className={`bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg ${className}`}>
      <div className="px-6 py-4 flex items-center justify-between gap-4">
        {/* Location Info */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <MapPinIcon className="w-6 h-6" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="text-lg font-semibold truncate">{location.name}</div>
            <div className="text-sm text-white/80 truncate">{location.address}</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onNavigate}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <ArrowsPointingOutIcon className="w-4 h-4" />
            <span>Go to location</span>
          </button>
          
          {onConfirm && (
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-white text-purple-600 hover:bg-white/90 rounded-lg transition-colors text-sm font-medium"
            >
              Set as waypoint
            </button>
          )}
          
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center hover:bg-white/20 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
