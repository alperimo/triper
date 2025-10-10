// Travel Style Selector Component
'use client';

import { Heart, Mountain, Camera, Utensils, Building, Users, Backpack, Coffee, Music, Book } from 'lucide-react';

const TRAVEL_STYLES = [
  { id: 'adventure', label: 'Adventure', icon: Mountain, color: 'text-orange-400' },
  { id: 'photography', label: 'Photography', icon: Camera, color: 'text-purple-400' },
  { id: 'food', label: 'Food & Cuisine', icon: Utensils, color: 'text-yellow-400' },
  { id: 'culture', label: 'Culture', icon: Building, color: 'text-blue-400' },
  { id: 'social', label: 'Social', icon: Users, color: 'text-green-400' },
  { id: 'backpacking', label: 'Backpacking', icon: Backpack, color: 'text-teal-400' },
  { id: 'relaxation', label: 'Relaxation', icon: Coffee, color: 'text-pink-400' },
  { id: 'nightlife', label: 'Nightlife', icon: Music, color: 'text-red-400' },
  { id: 'learning', label: 'Learning', icon: Book, color: 'text-indigo-400' },
] as const;

interface TravelStyleSelectorProps {
  selectedInterests: string[];
  onChange: (interests: string[]) => void;
}

export function TravelStyleSelector({ selectedInterests, onChange }: TravelStyleSelectorProps) {
  const toggleInterest = (id: string) => {
    if (selectedInterests.includes(id)) {
      onChange(selectedInterests.filter((i) => i !== id));
    } else {
      onChange([...selectedInterests, id]);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-400">
        Select all travel styles that match your interests (choose at least one)
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {TRAVEL_STYLES.map((style) => {
          const isSelected = selectedInterests.includes(style.id);
          const Icon = style.icon;

          return (
            <button
              key={style.id}
              onClick={() => toggleInterest(style.id)}
              className={`
                relative p-4 rounded-lg border-2 transition-all duration-200
                ${
                  isSelected
                    ? 'bg-blue-600/20 border-blue-600 shadow-lg shadow-blue-600/20'
                    : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                }
              `}
            >
              <div className="flex flex-col items-center gap-2">
                <Icon className={`w-8 h-8 ${isSelected ? 'text-blue-400' : style.color}`} />
                <span className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                  {style.label}
                </span>
              </div>

              {/* Selection Indicator */}
              {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="3"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Count */}
      {selectedInterests.length > 0 && (
        <div className="bg-green-600/10 border border-green-600/20 rounded-lg p-4">
          <p className="text-sm text-green-400">
            ✓ {selectedInterests.length} travel {selectedInterests.length === 1 ? 'style' : 'styles'} selected
          </p>
        </div>
      )}
    </div>
  );
}
