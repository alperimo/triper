'use client';

import { MapView } from '@/components/map/MapView';
import { RouteSearchBar } from '@/components/map/RouteSearchBar';
import { RouteWaypointPanel, Waypoint } from '@/components/map/RouteWaypointPanel';
import { LocationHUD } from '@/components/map/LocationHUD';
import { useState, useCallback } from 'react';
import { useTrips } from '@/hooks/useTrips';
import { useUserStore } from '@/lib/store/user';
import { showSuccess, showError } from '@/lib/toast';
import { CheckIcon } from '@heroicons/react/24/outline';

export default function MapPage() {
  const { createTrip, loading } = useTrips();
  const { publicKey } = useUserStore();
  
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [destination, setDestination] = useState<Waypoint | undefined>(undefined);
  const [selectedLocation, setSelectedLocation] = useState<{
    name: string;
    address: string;
    lat: number;
    lng: number;
  } | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // Navigate map to a specific location
  const navigateToLocation = useCallback((lat: number, lng: number) => {
    setMapCenter([lng, lat]);
  }, []);

  // Handle location selection from search
  const handleSearchSelect = useCallback((location: { lat: number; lng: number; name: string; address: string }) => {
    setSelectedLocation(location);
    navigateToLocation(location.lat, location.lng);
    setIsPanelOpen(true); // Show panel when location is selected
  }, [navigateToLocation]);

  // Handle waypoint focus
  const handleWaypointFocus = useCallback((waypoint: Waypoint) => {
    navigateToLocation(waypoint.lat, waypoint.lng);
  }, [navigateToLocation]);

  // Handle create trip
  const handleCreateTrip = useCallback(async () => {
    if (!publicKey) {
      showError('Please connect your wallet first');
      return;
    }

    if (waypoints.length === 0) {
      showError('Please add at least one waypoint');
      return;
    }

    if (!destination) {
      showError('Please add a destination');
      return;
    }

    try {
      await createTrip(
        waypoints.map(w => ({ lat: w.lat, lng: w.lng })),
        { lat: destination.lat, lng: destination.lng },
        new Date(),
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
        []
      );
      
      // Reset form
      setWaypoints([]);
      setDestination(undefined);
      setSelectedLocation(null);
    } catch (error) {
      console.error('Create trip error:', error);
    }
  }, [publicKey, waypoints, destination, createTrip]);

  const hasRoute = waypoints.length > 0 || destination;

  return (
    <div className="relative h-full w-full">
      {/* Location HUD - Top */}
      {selectedLocation && (
        <div className="absolute top-0 left-0 right-0 z-30">
          <LocationHUD
            location={selectedLocation}
            onNavigate={() => navigateToLocation(selectedLocation.lat, selectedLocation.lng)}
            onClose={() => setSelectedLocation(null)}
          />
        </div>
      )}

      {/* Search Bar - Top Left */}
      <div className="absolute top-4 left-4 z-20 w-96">
        <RouteSearchBar
          onSelectLocation={handleSearchSelect}
          placeholder="Search for places..."
          onTogglePanel={() => setIsPanelOpen(!isPanelOpen)}
          isPanelOpen={isPanelOpen}
        />
      </div>

      {/* Waypoint Panel - Left Side */}
      {isPanelOpen && (
        <div className="absolute left-4 top-24 bottom-4 z-20 w-96">
          <RouteWaypointPanel
            waypoints={waypoints}
            destination={destination}
            onChange={(newWaypoints, newDestination) => {
              setWaypoints(newWaypoints);
              setDestination(newDestination);
            }}
            onFocusWaypoint={handleWaypointFocus}
            onClose={() => setIsPanelOpen(false)}
            className="h-full"
          />
        </div>
      )}

      {/* Create Trip Button - Bottom Right */}
      {hasRoute && (
        <div className="absolute bottom-8 right-8 z-20">
          <button
            onClick={handleCreateTrip}
            disabled={loading || waypoints.length === 0 || !destination}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
          >
            <CheckIcon className="w-5 h-5" />
            <span>Create Trip</span>
          </button>
        </div>
      )}

      {/* Map View */}
      <MapView 
        height="100vh"
        showControls={true}
        initialCenter={mapCenter || [-122.45, 37.78]}
        initialZoom={mapCenter ? 15 : 10}
        // Pass waypoints as markers
        markers={[
          ...waypoints.map((w, i) => ({
            lng: w.lng,
            lat: w.lat,
            label: `${i + 1}`,
            color: '#8b5cf6',
          })),
          ...(destination ? [{
            lng: destination.lng,
            lat: destination.lat,
            label: '🎯',
            color: '#ef4444',
          }] : []),
        ]}
      />
    </div>
  );
}

