'use client';

import { MapView } from '@/components/map/MapView';
import { RouteSearchBar } from '@/components/map/RouteSearchBar';
import { RouteWaypointPanel, Waypoint } from '@/components/map/RouteWaypointPanel';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { useTrips } from '@/hooks/useTrips';
import { useUserStore } from '@/lib/store/user';
import { showSuccess, showError } from '@/lib/toast';
import { CheckIcon, XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { getRoute, type RoutingProfile, formatDistance, formatDuration, getAvailableProfiles } from '@/lib/services/routing';

export default function MapPage() {
  const { createTrip, loading } = useTrips();
  const { publicKey } = useUserStore();
  
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [destination, setDestination] = useState<Waypoint | undefined>(undefined);
  const [routingProfile, setRoutingProfile] = useState<RoutingProfile>('straight'); // Default to most private
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
  const [routeInfo, setRouteInfo] = useState<{ distance: number; duration: number } | null>(null);
  const availableProfiles = getAvailableProfiles(); // Check what's available
  
  // Pin placement mode
  const [pendingPin, setPendingPin] = useState<{
    name: string;
    address: string;
    lat: number;
    lng: number;
  } | null>(null);
  
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false); // For mobile collapsed state
  const [isDesktopPanelCollapsed, setIsDesktopPanelCollapsed] = useState(false); // For desktop slide in/out
  const [showSearchForWaypoint, setShowSearchForWaypoint] = useState(false);

  // Navigate map to a specific location
  const navigateToLocation = useCallback((lat: number, lng: number) => {
    setMapCenter([lng, lat]);
  }, []);

  const handleRequestAddWaypoint = useCallback(() => {
  }, []);

  // Handle location selection from search (map search bar OR panel inline search)
  const handleSearchSelect = useCallback((location: { lat: number; lng: number; name: string; address: string }) => {
    setPendingPin(location);
    navigateToLocation(location.lat, location.lng);
    setShowSearchForWaypoint(false); // Hide search after selection
    
    // Immediately add as pending waypoint to show in route planner
    const pendingWaypoint: Waypoint = {
      id: `pending-${Date.now()}`,
      ...location,
    };
    setWaypoints(prev => [...prev, pendingWaypoint]);
    setIsPanelOpen(true); // Show panel with the pending waypoint
    setIsPanelCollapsed(false); // Ensure mobile panel is expanded
    setIsDesktopPanelCollapsed(false); // Ensure desktop panel is visible
  }, [navigateToLocation]);

  // Confirm pin placement - convert pending to confirmed
  const handleConfirmPin = useCallback(() => {
    if (!pendingPin) return;
    
    // Just clear the pending state - waypoint is already in the list
    setPendingPin(null);
  }, [pendingPin]);

  // Cancel pin placement - remove the pending waypoint
  const handleCancelPin = useCallback(() => {
    if (pendingPin) {
      // Remove the last waypoint (the pending one)
      setWaypoints(prev => prev.slice(0, -1));
    }
    setPendingPin(null);
    setShowSearchForWaypoint(false);
  }, [pendingPin]);

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
      setPendingPin(null);
      setIsPanelOpen(false);
    } catch (error) {
      console.error('Create trip error:', error);
    }
  }, [publicKey, waypoints, destination, createTrip]);

  const hasRoute = waypoints.length > 0 || destination;
  const hasAnyWaypoints = waypoints.length > 0;
  const showSearchBar = !hasAnyWaypoints && !pendingPin; // Show map search when no waypoints and no pending pin
  const showPanel = hasAnyWaypoints; // Show panel ONLY if there are waypoints (completely hidden otherwise)

  // Fetch route when waypoints or routing profile changes
  useEffect(() => {
    const fetchRoute = async () => {
      const allPoints = [...waypoints];
      if (destination) {
        allPoints.push(destination);
      }
      
      // Need at least 2 points to draw a route
      if (allPoints.length < 2) {
        setRouteCoordinates([]);
        setRouteInfo(null);
        return;
      }
      
      try {
        const routeWaypoints = allPoints.map(w => ({ lng: w.lng, lat: w.lat }));
        const result = await getRoute(routeWaypoints, routingProfile);
        setRouteCoordinates(result.coordinates);
        setRouteInfo({ distance: result.distance, duration: result.duration });
      } catch (error) {
        console.error('Failed to fetch route:', error);
        // Fallback to straight line
        const straightCoords = allPoints.map(w => [w.lng, w.lat] as [number, number]);
        setRouteCoordinates(straightCoords);
        setRouteInfo(null);
      }
    };
    
    fetchRoute();
  }, [waypoints, destination, routingProfile]);

  // Calculate route lines connecting waypoints
  const routeLines = useMemo(() => {
    // If we have fetched route coordinates, use them
    if (routeCoordinates.length > 0) {
      return [{
        coordinates: routeCoordinates,
        color: routingProfile === 'car' ? '#3b82f6' : routingProfile === 'foot' ? '#10b981' : routingProfile === 'bike' ? '#f59e0b' : '#6b8e23',
        width: 6,
      }];
    }
    
    return [];
  }, [routeCoordinates, routingProfile]);

  return (
    <div className="relative h-full w-full">
      {/* Search Bar - Only show when no waypoints and no pending pin */}
      {showSearchBar && (
        <div className="absolute top-4 left-4 right-4 z-20 md:right-auto md:w-96">
          <RouteSearchBar
            onSelectLocation={handleSearchSelect}
            placeholder="Search for places..."
            onTogglePanel={() => setIsPanelOpen(true)}
            isPanelOpen={false}
          />
        </div>
      )}

      {/* Pin Confirmation Buttons - Show when pending pin */}
      {pendingPin && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-white shadow-lg rounded-lg px-4 py-3 flex items-center gap-3 border border-gray-200">
          <span className="text-sm font-medium text-gray-900 truncate max-w-xs">
            {pendingPin.name}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleConfirmPin}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors flex items-center gap-1 text-sm font-medium"
            >
              <CheckIcon className="w-4 h-4" />
              OK
            </button>
            <button
              onClick={handleCancelPin}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1 text-sm font-medium"
            >
              <XMarkIcon className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Routing Profile Selector - Only show when there are waypoints AND multiple routing options available */}
      {hasAnyWaypoints && availableProfiles.length > 1 && (
        <div className="absolute top-4 right-4 z-30 bg-white shadow-lg rounded-lg border border-gray-200 overflow-hidden">
          <div className="flex">
            {availableProfiles.includes('straight') && (
              <button
                onClick={() => setRoutingProfile('straight')}
                className={`px-4 py-2.5 text-sm font-medium transition-colors flex items-center gap-2 ${
                  routingProfile === 'straight'
                    ? 'bg-gray-700 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
                title="Straight line (most private)"
              >
                ➖ Direct
              </button>
            )}
            {availableProfiles.includes('car') && (
              <button
                onClick={() => setRoutingProfile('car')}
                className={`px-4 py-2.5 text-sm font-medium transition-colors flex items-center gap-2 border-l border-gray-200 ${
                  routingProfile === 'car'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
                title="Car routing (requires self-hosted server)"
              >
                � Car
              </button>
            )}
            {availableProfiles.includes('foot') && (
              <button
                onClick={() => setRoutingProfile('foot')}
                className={`px-4 py-2.5 text-sm font-medium transition-colors flex items-center gap-2 border-l border-gray-200 ${
                  routingProfile === 'foot'
                    ? 'bg-green-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
                title="Walking route (requires self-hosted server)"
              >
                � Walk
              </button>
            )}
            {availableProfiles.includes('bike') && (
              <button
                onClick={() => setRoutingProfile('bike')}
                className={`px-4 py-2.5 text-sm font-medium transition-colors flex items-center gap-2 border-l border-gray-200 ${
                  routingProfile === 'bike'
                    ? 'bg-orange-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
                title="Bicycle routing (requires self-hosted server)"
              >
                🚴 Bike
              </button>
            )}
          </div>
          {routeInfo && (
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-600 flex gap-4">
              <span>📏 {formatDistance(routeInfo.distance)}</span>
              <span>⏱️ {formatDuration(routeInfo.duration)}</span>
            </div>
          )}
        </div>
      )}

      {/* Waypoint Panel - Only show if there are waypoints OR panel is manually opened */}
      {showPanel && (
        <>
          {/* Desktop Panel - Slides in/out from left */}
          <div 
            className={`hidden md:block absolute top-4 bottom-4 z-20 w-96 transition-all duration-300 ${
              isDesktopPanelCollapsed ? '-left-96' : 'left-4'
            }`}
          >
            <RouteWaypointPanel
              waypoints={waypoints}
              destination={destination}
              onChange={(newWaypoints, newDestination) => {
                setWaypoints(newWaypoints);
                setDestination(newDestination);
              }}
              onSelectLocation={handleSearchSelect}
              onFocusWaypoint={handleWaypointFocus}
              hasPendingPin={!!pendingPin}
              className="h-full"
            />
          </div>

          {/* Desktop Toggle Button - Right edge of panel */}
          <button
            onClick={() => setIsDesktopPanelCollapsed(!isDesktopPanelCollapsed)}
            className={`hidden md:flex absolute top-1/2 -translate-y-1/2 z-30 w-8 h-16 bg-white hover:bg-gray-50 border border-gray-200 items-center justify-center rounded-r-lg shadow-md transition-all duration-300 ${
              isDesktopPanelCollapsed ? 'left-0' : 'left-[25rem]'
            }`}
            title={isDesktopPanelCollapsed ? 'Show route planner' : 'Hide route planner'}
          >
            {isDesktopPanelCollapsed ? (
              <ChevronRightIcon className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
            )}
          </button>

          {/* Mobile Bottom Sheet - Expands upward from bottom */}
          <div 
            className="md:hidden fixed left-0 right-0 bottom-0 z-40 transition-all duration-300"
          >
            <RouteWaypointPanel
              waypoints={waypoints}
              destination={destination}
              onChange={(newWaypoints, newDestination) => {
                setWaypoints(newWaypoints);
                setDestination(newDestination);
              }}
              onSelectLocation={handleSearchSelect}
              onFocusWaypoint={handleWaypointFocus}
              onClose={() => setIsPanelCollapsed(!isPanelCollapsed)}
              onRequestAddWaypoint={handleRequestAddWaypoint}
              hasPendingPin={!!pendingPin}
              isMobile={true}
              isCollapsed={isPanelCollapsed}
              onToggleCollapse={() => setIsPanelCollapsed(!isPanelCollapsed)}
            />
          </div>
        </>
      )}

      {/* Create Trip Button - Bottom Right (Desktop only, hidden on mobile when panel open) */}
      {hasRoute && (
        <div className={`absolute bottom-8 right-8 z-20 ${isPanelOpen ? 'hidden md:flex' : 'flex'}`}>
          <button
            onClick={handleCreateTrip}
            disabled={loading || waypoints.length === 0 || !destination}
            className="px-6 py-3 bg-primary text-white rounded-lg shadow-lg hover:bg-primary-hover hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
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
        // Pass route lines connecting waypoints
        routeLines={routeLines}
        // Pass waypoints and pending pin as markers
        markers={[
          // Pending pin (yellow/orange)
          ...(pendingPin ? [{
            lng: pendingPin.lng,
            lat: pendingPin.lat,
            label: '📍',
            color: '#f59e0b',
          }] : []),
          // Waypoints (green with numbers)
          ...waypoints.map((w, i) => ({
            lng: w.lng,
            lat: w.lat,
            label: `${i + 1}`,
            color: '#6b8e23',
          })),
          // Destination (red)
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

