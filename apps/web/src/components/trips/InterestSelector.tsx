'use client';

import { InterestTag } from '@/types';
import { Check } from 'lucide-react';

interface InterestSelectorProps {
  selected: InterestTag[];
  onChange: (interests: InterestTag[]) => void;
  max?: number; // Maximum number of selections
}

// Interest metadata for display
const INTEREST_INFO: Record<InterestTag, { label: string; emoji: string; category: string }> = {
  [InterestTag.HIKING]: { label: 'Hiking', emoji: '🥾', category: 'Outdoor' },
  [InterestTag.PHOTOGRAPHY]: { label: 'Photography', emoji: '📸', category: 'Creative' },
  [InterestTag.FOOD]: { label: 'Food', emoji: '🍽️', category: 'Culture' },
  [InterestTag.CULTURE]: { label: 'Culture', emoji: '🏛️', category: 'Culture' },
  [InterestTag.BEACH]: { label: 'Beach', emoji: '🏖️', category: 'Outdoor' },
  [InterestTag.NIGHTLIFE]: { label: 'Nightlife', emoji: '🌙', category: 'Social' },
  [InterestTag.ADVENTURE]: { label: 'Adventure', emoji: '⛰️', category: 'Outdoor' },
  [InterestTag.RELAXATION]: { label: 'Relaxation', emoji: '🧘', category: 'Wellness' },
  [InterestTag.SHOPPING]: { label: 'Shopping', emoji: '🛍️', category: 'Leisure' },
  [InterestTag.WILDLIFE]: { label: 'Wildlife', emoji: '🦁', category: 'Nature' },
  [InterestTag.HISTORY]: { label: 'History', emoji: '📜', category: 'Culture' },
  [InterestTag.ART]: { label: 'Art', emoji: '🎨', category: 'Creative' },
  [InterestTag.MUSIC]: { label: 'Music', emoji: '🎵', category: 'Creative' },
  [InterestTag.SPORTS]: { label: 'Sports', emoji: '⚽', category: 'Active' },
  [InterestTag.SKIING]: { label: 'Skiing', emoji: '⛷️', category: 'Outdoor' },
  [InterestTag.DIVING]: { label: 'Diving', emoji: '🤿', category: 'Water' },
  [InterestTag.SURFING]: { label: 'Surfing', emoji: '🏄', category: 'Water' },
  [InterestTag.CLIMBING]: { label: 'Climbing', emoji: '🧗', category: 'Outdoor' },
  [InterestTag.CYCLING]: { label: 'Cycling', emoji: '🚴', category: 'Active' },
  [InterestTag.RUNNING]: { label: 'Running', emoji: '🏃', category: 'Active' },
  [InterestTag.YOGA]: { label: 'Yoga', emoji: '🧘‍♀️', category: 'Wellness' },
  [InterestTag.MEDITATION]: { label: 'Meditation', emoji: '🕉️', category: 'Wellness' },
  [InterestTag.COOKING]: { label: 'Cooking', emoji: '👨‍🍳', category: 'Culture' },
  [InterestTag.WINE]: { label: 'Wine', emoji: '🍷', category: 'Food & Drink' },
  [InterestTag.COFFEE]: { label: 'Coffee', emoji: '☕', category: 'Food & Drink' },
  [InterestTag.LOCAL]: { label: 'Local Experiences', emoji: '🗺️', category: 'Culture' },
  [InterestTag.LUXURY]: { label: 'Luxury', emoji: '💎', category: 'Style' },
  [InterestTag.BUDGET]: { label: 'Budget', emoji: '💰', category: 'Style' },
  [InterestTag.ECO]: { label: 'Eco-Friendly', emoji: '🌱', category: 'Style' },
  [InterestTag.FAMILY]: { label: 'Family', emoji: '👨‍👩‍👧‍👦', category: 'Travel Style' },
  [InterestTag.SOLO]: { label: 'Solo', emoji: '🚶', category: 'Travel Style' },
  [InterestTag.COUPLE]: { label: 'Couple', emoji: '💑', category: 'Travel Style' },
};

// Group interests by category
const CATEGORIES = [
  { name: 'Outdoor', interests: [InterestTag.HIKING, InterestTag.ADVENTURE, InterestTag.BEACH, InterestTag.SKIING, InterestTag.CLIMBING] },
  { name: 'Water', interests: [InterestTag.DIVING, InterestTag.SURFING] },
  { name: 'Active', interests: [InterestTag.SPORTS, InterestTag.CYCLING, InterestTag.RUNNING] },
  { name: 'Culture', interests: [InterestTag.CULTURE, InterestTag.HISTORY, InterestTag.LOCAL, InterestTag.COOKING, InterestTag.FOOD] },
  { name: 'Creative', interests: [InterestTag.PHOTOGRAPHY, InterestTag.ART, InterestTag.MUSIC] },
  { name: 'Nature', interests: [InterestTag.WILDLIFE] },
  { name: 'Wellness', interests: [InterestTag.RELAXATION, InterestTag.YOGA, InterestTag.MEDITATION] },
  { name: 'Social', interests: [InterestTag.NIGHTLIFE] },
  { name: 'Leisure', interests: [InterestTag.SHOPPING] },
  { name: 'Food & Drink', interests: [InterestTag.WINE, InterestTag.COFFEE] },
  { name: 'Style', interests: [InterestTag.LUXURY, InterestTag.BUDGET, InterestTag.ECO] },
  { name: 'Travel Style', interests: [InterestTag.FAMILY, InterestTag.SOLO, InterestTag.COUPLE] },
];

export function InterestSelector({ selected, onChange, max }: InterestSelectorProps) {
  const toggleInterest = (interest: InterestTag) => {
    if (selected.includes(interest)) {
      onChange(selected.filter(i => i !== interest));
    } else {
      if (max && selected.length >= max) {
        return; // Max reached
      }
      onChange([...selected, interest]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Select Your Interests</h3>
          <p className="text-sm text-gray-400 mt-1">
            Choose activities and preferences that match your travel style
            {max && ` (max ${max})`}
          </p>
        </div>
        <div className="text-sm text-gray-400">
          {selected.length} selected
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-4">
        {CATEGORIES.map(category => (
          <div key={category.name}>
            <h4 className="text-sm font-medium text-gray-400 mb-2">{category.name}</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {category.interests.map(interest => {
                const info = INTEREST_INFO[interest];
                const isSelected = selected.includes(interest);
                const isDisabled = Boolean(max && !isSelected && selected.length >= max);
                
                return (
                  <button
                    key={interest}
                    onClick={() => toggleInterest(interest)}
                    disabled={isDisabled}
                    className={`
                      relative p-3 rounded-lg border-2 transition-all
                      ${isSelected 
                        ? 'border-blue-500 bg-blue-500/10' 
                        : isDisabled
                          ? 'border-gray-700 bg-gray-800/50 opacity-50 cursor-not-allowed'
                          : 'border-gray-700 bg-gray-800 hover:border-gray-600 hover:bg-gray-750'
                      }
                    `}
                  >
                    {/* Checkmark */}
                    {isSelected && (
                      <div className="absolute top-1 right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                    
                    {/* Content */}
                    <div className="text-center">
                      <div className="text-2xl mb-1">{info.emoji}</div>
                      <div className="text-xs font-medium">{info.label}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Selected Pills (mobile-friendly) */}
      {selected.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-400 mb-2">Selected Interests:</h4>
          <div className="flex flex-wrap gap-2">
            {selected.map(interest => {
              const info = INTEREST_INFO[interest];
              return (
                <button
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-full text-sm hover:bg-blue-500/30 transition-colors"
                >
                  <span>{info.emoji}</span>
                  <span>{info.label}</span>
                  <span className="text-xs">×</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
