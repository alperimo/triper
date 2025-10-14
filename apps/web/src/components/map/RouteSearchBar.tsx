/**
 * RouteSearchBar - Search bar for finding places with autocomplete
 * 
 * Features:
 * - Place search with autocomplete
 * - Recent searches history
 * - "My Location" option
 * - Dropdown results
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MagnifyingGlassIcon, MapPinIcon, ClockIcon, XMarkIcon, Bars3Icon } from '@heroicons/react/24/outline';

interface SearchResult {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  type?: 'place' | 'location' | 'recent';
}

interface RouteSearchBarProps {
  onSelectLocation: (location: { lat: number; lng: number; name: string; address: string }) => void;
  placeholder?: string;
  className?: string;
  onTogglePanel?: () => void;
  isPanelOpen?: boolean;
  fullWidthDropdown?: boolean; // Make dropdown span full parent width
}

const RECENT_SEARCHES_KEY = 'triper_recent_searches';
const MAX_RECENT_SEARCHES = 5;

export function RouteSearchBar({ 
  onSelectLocation, 
  placeholder = 'Search for a place',
  className = '',
  onTogglePanel,
  isPanelOpen = false,
  fullWidthDropdown = false
}: RouteSearchBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to load recent searches:', error);
      }
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search for places using Nominatim (OpenStreetMap)
  useEffect(() => {
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    const searchPlaces = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`
        );
        const data = await response.json();
        
        const searchResults: SearchResult[] = data.map((item: any) => ({
          id: item.place_id.toString(),
          name: item.display_name.split(',')[0],
          address: item.display_name,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          type: 'place' as const,
        }));
        
        setResults(searchResults);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(searchPlaces, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const saveToRecentSearches = (result: SearchResult) => {
    const updated = [
      result,
      ...recentSearches.filter(r => r.id !== result.id)
    ].slice(0, MAX_RECENT_SEARCHES);
    
    setRecentSearches(updated);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  };

  const handleSelectLocation = (result: SearchResult) => {
    saveToRecentSearches(result);
    onSelectLocation({
      lat: result.lat,
      lng: result.lng,
      name: result.name,
      address: result.address,
    });
    setSearchQuery('');
    setIsOpen(false);
  };

  const handleUseCurrentLocation = async () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          // Reverse geocode to get address
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const data = await response.json();
            
            const location = {
              id: 'current-location',
              name: 'My Location',
              address: data.display_name || 'Current Location',
              lat: latitude,
              lng: longitude,
              type: 'location' as const,
            };
            
            handleSelectLocation(location);
          } catch (error) {
            console.error('Reverse geocoding error:', error);
            onSelectLocation({
              lat: latitude,
              lng: longitude,
              name: 'My Location',
              address: 'Current Location',
            });
            setIsOpen(false);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          alert('Unable to get your location. Please enable location permissions.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setResults([]);
  };

  const displayResults = searchQuery.length >= 2 ? results : recentSearches;

  // Calculate dropdown position for full width mode
  const getDropdownStyles = () => {
    if (!fullWidthDropdown || !searchRef.current) return {};
    
    // Find the panel container (has p-4 class)
    let panel = searchRef.current.closest('.p-4');
    if (!panel) panel = searchRef.current.closest('[class*="p-"]');
    
    if (panel) {
      const searchRect = searchRef.current.getBoundingClientRect();
      const panelRect = panel.getBoundingClientRect();
      return {
        left: `${panelRect.left - searchRect.left}px`,
        right: `${searchRect.right - panelRect.right}px`,
      };
    }
    return {};
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative w-full">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
          <MagnifyingGlassIcon className="w-5 h-5" />
        </div>
        
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-12 pr-10 py-3 bg-white border border-gray-300 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 placeholder-gray-500"
        />
        
        {searchQuery && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        )}
        
        {isLoading && (
          <div className="absolute right-14 top-1/2 -translate-y-1/2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
          </div>
        )}
      </div>

      {/* Dropdown Results - Spans full panel width when enabled */}
      {isOpen && (
        <div 
          className={`absolute top-full mt-2 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50 max-h-96 overflow-y-auto ${
            fullWidthDropdown ? '' : 'w-full'
          }`}
          style={fullWidthDropdown ? { left: '-2.5rem', right: '-2.5rem' } : {}}
        >
          {/* My Location Option */}
          <button
            onClick={handleUseCurrentLocation}
            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-100"
          >
            <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <MapPinIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="font-medium text-gray-900">My Location</div>
              <div className="text-sm text-gray-500">Use current location</div>
            </div>
          </button>

          {/* Search Results or Recent Searches */}
          {displayResults.length > 0 ? (
            <>
              {searchQuery.length < 2 && (
                <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide bg-gray-50">
                  Recent Searches
                </div>
              )}
              
              {displayResults.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleSelectLocation(result)}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    {result.type === 'recent' ? (
                      <ClockIcon className="w-5 h-5 text-gray-600" />
                    ) : (
                      <MapPinIcon className="w-5 h-5 text-gray-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">{result.name}</div>
                    <div className="text-sm text-gray-500 truncate">{result.address}</div>
                  </div>
                </button>
              ))}
            </>
          ) : searchQuery.length >= 2 ? (
            <div className="px-4 py-8 text-center text-gray-500">
              No results found for "{searchQuery}"
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
