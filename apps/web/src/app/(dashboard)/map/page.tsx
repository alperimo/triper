'use client';

import { MapView } from '@/components/map/MapView';
import { RouteSearchBar } from '@/components/map/RouteSearchBar';
import { RouteWaypointPanel, Waypoint } from '@/components/map/RouteWaypointPanel';
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { ElementType } from 'react';
import { useTrips } from '@/hooks/useTrips';
import { useUserStore } from '@/lib/store/user';
import { showSuccess, showError } from '@/lib/toast';
import {
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  LockClosedIcon,
  TruckIcon,
  UserIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { getRoute, type RoutingProfile, formatDistance, formatDuration, getAvailableProfiles } from '@/lib/services/routing';
import { reverseGeocode } from '@/lib/services/geocoding';

export default function MapPage() {
  const { createTrip, loading } = useTrips();
  const { publicKey } = useUserStore();
  
  const rootContainerRef = useRef<HTMLDivElement | null>(null);
  const desktopPanelRef = useRef<HTMLDivElement | null>(null);

  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [destination, setDestination] = useState<Waypoint | undefined>(undefined);
  const [routingProfile, setRoutingProfile] = useState<RoutingProfile>('straight'); // Default to most private
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
  const [routeInfo, setRouteInfo] = useState<{ distance: number; duration: number } | null>(null);
  const availableProfiles = getAvailableProfiles(); // Check what's available
  const routingConfig: Record<
    RoutingProfile,
    { label: string; sublabel: string; gradient: string; icon: ElementType }
  > = {
    straight: {
      label: 'Stealth',
      sublabel: 'Direct & private',
      gradient: 'from-slate-800 to-slate-600',
      icon: LockClosedIcon,
    },
    car: {
      label: 'Drive',
      sublabel: 'Road optimised',
      gradient: 'from-sky-600 to-blue-500',
      icon: TruckIcon,
    },
    foot: {
      label: 'Walk',
      sublabel: 'Pedestrian safe',
      gradient: 'from-emerald-600 to-teal-500',
      icon: UserIcon,
    },
    bike: {
      label: 'Ride',
      sublabel: 'Cyclist friendly',
      gradient: 'from-amber-500 to-orange-500',
      icon: SparklesIcon,
    },
  };
  const routingOptions = availableProfiles.map(profile => ({
    profile,
    ...routingConfig[profile],
  }));
  const visibleRoutingOptions = routingOptions.filter(option => option.profile !== 'straight');
  const routePalette: Record<RoutingProfile, string> = {
    straight: '#334155',
    car: '#2563eb',
    foot: '#047857',
    bike: '#f97316',
  };
  const activeRouting = routingConfig[routingProfile];
  
  // Pin placement mode
  const [pendingPin, setPendingPin] = useState<{
    name: string;
    address: string;
    lat: number;
    lng: number;
  } | null>(null);
  
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(true); // For mobile collapsed state
  const [isDesktopPanelCollapsed, setIsDesktopPanelCollapsed] = useState(false); // For desktop slide in/out
  const [desktopToggleTop, setDesktopToggleTop] = useState<number | null>(null);

  // Navigate map to a specific location
  const navigateToLocation = useCallback((lat: number, lng: number) => {
    setMapCenter([lng, lat]);
  }, []);

  // Handle map click to add waypoint
  const handleMapClick = useCallback(async (event: { lng: number; lat: number; lngLat: [number, number] }) => {
    // Don't add waypoint if there's already a pending pin
    if (pendingPin) return;
    
    const { lng, lat } = event;
    
    // Use geocoding service to get location information
    const location = await reverseGeocode(lat, lng);
    
    setPendingPin({
      name: location.name,
      address: location.address,
      lat: location.lat,
      lng: location.lng,
    });
    
    navigateToLocation(lat, lng);
  }, [pendingPin, navigateToLocation]);

  // Handle location selection from search (map search bar OR panel inline search)
  const handleSearchSelect = useCallback((location: { lat: number; lng: number; name: string; address: string }) => {
    setPendingPin(location);
    navigateToLocation(location.lat, location.lng);
    setIsPanelCollapsed(false); // Ensure mobile panel is expanded
    setIsDesktopPanelCollapsed(false); // Ensure desktop panel is visible
  }, [navigateToLocation]);

  // Confirm pin placement - add waypoint to list
  const handleConfirmPin = useCallback(() => {
    if (!pendingPin) return;
    
    // Add the pending pin as a confirmed waypoint
    const newWaypoint: Waypoint = {
      id: `waypoint-${Date.now()}`,
      name: pendingPin.name,
      address: pendingPin.address,
      lat: pendingPin.lat,
      lng: pendingPin.lng,
    };
    
    setWaypoints(prev => [...prev, newWaypoint]);
    setPendingPin(null);
    setIsPanelCollapsed(false);
    setIsDesktopPanelCollapsed(false);
  }, [pendingPin]);

  // Cancel pin placement - remove the pending waypoint
  const handleCancelPin = useCallback(() => {
    setPendingPin(null);
  }, []);

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
    } catch (error) {
      console.error('Create trip error:', error);
    }
  }, [publicKey, waypoints, destination, createTrip]);

  const hasRoute = waypoints.length > 0 || destination;
  const hasAnyWaypoints = waypoints.length > 0;
  const totalStops = waypoints.length + (destination ? 1 : 0);
  const showSearchBar = !pendingPin && isDesktopPanelCollapsed && isPanelCollapsed; // Show map search when no pending pin and route planner is closed

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
      return [
        {
          coordinates: routeCoordinates,
          color: routePalette[routingProfile] ?? '#6b8e23',
          width: 6,
        },
      ];
    }
    
    return [];
  }, [routeCoordinates, routingProfile]);

  // Handle marker drag to update waypoint position
  const handleMarkerDrag = useCallback(async (markerId: string, lng: number, lat: number) => {
    // Handle pending pin drag
    if (markerId === 'pending' && pendingPin) {
      const location = await reverseGeocode(lat, lng);
      
      setPendingPin({
        name: location.name,
        address: location.address,
        lat: location.lat,
        lng: location.lng,
      });
      
      navigateToLocation(lat, lng);
      return;
    }
    
    // Find which waypoint was dragged
    const waypointIndex = waypoints.findIndex(w => w.id === markerId);
    
    if (waypointIndex !== -1) {
      // Reverse geocode the new position to get location name
      const location = await reverseGeocode(lat, lng);
      
      // Update the waypoint
      const updatedWaypoints = [...waypoints];
      updatedWaypoints[waypointIndex] = {
        ...updatedWaypoints[waypointIndex],
        lat: location.lat,
        lng: location.lng,
        name: location.name,
        address: location.address,
      };
      
      setWaypoints(updatedWaypoints);
    }
    
    // Check if destination was dragged
    if (destination && destination.id === markerId) {
      const location = await reverseGeocode(lat, lng);
      
      setDestination({
        ...destination,
        lat: location.lat,
        lng: location.lng,
        name: location.name,
        address: location.address,
      });
    }
  }, [waypoints, destination, pendingPin, navigateToLocation]);

  useEffect(() => {
    const rootEl = rootContainerRef.current;
    const panelEl = desktopPanelRef.current;

    if (!rootEl || !panelEl) return;

    const updateTogglePosition = () => {
      const refreshedRoot = rootContainerRef.current;
      const refreshedPanel = desktopPanelRef.current;

      if (!refreshedRoot || !refreshedPanel) return;

      const panelRect = refreshedPanel.getBoundingClientRect();
      const rootRect = refreshedRoot.getBoundingClientRect();

      const nextTop = panelRect.top + panelRect.height / 2 - rootRect.top;

      setDesktopToggleTop((prev) => {
        if (prev === null) return nextTop;
        return Math.abs(prev - nextTop) > 0.5 ? nextTop : prev;
      });
    };

    updateTogglePosition();

    let resizeObserver: ResizeObserver | null = null;

    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => updateTogglePosition());
      resizeObserver.observe(panelEl);
    }

    window.addEventListener('resize', updateTogglePosition);

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      window.removeEventListener('resize', updateTogglePosition);
    };
  }, [isDesktopPanelCollapsed]);

  return (
    <div ref={rootContainerRef} className="absolute inset-0">
      {/* Search Bar - Only show when no waypoints and no pending pin */}
      {showSearchBar && (
        <div className="absolute top-24 left-4 right-4 z-20 md:top-28 md:right-auto md:w-96">
          <RouteSearchBar
            onSelectLocation={handleSearchSelect}
            placeholder="Search for places..."
          />
        </div>
      )}

      {/* Routing Profile Selector */}
      {hasAnyWaypoints && visibleRoutingOptions.length > 0 && (
        <div className="absolute top-24 right-4 z-30 space-y-3 rounded-[26px] border border-white/40 bg-white/80 p-4 shadow-[var(--shadow-soft)] backdrop-blur md:top-28">
          <div className="flex flex-col gap-3">
            {visibleRoutingOptions.map(({ profile, label, sublabel, gradient, icon: Icon }) => {
              const isActive = routingProfile === profile;
              return (
                <button
                  key={profile}
                  onClick={() => setRoutingProfile(profile)}
                  className={`relative overflow-hidden rounded-2xl border px-5 py-4 text-left transition focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                    isActive
                      ? 'border-transparent shadow-[var(--shadow-soft)] text-white'
                      : 'border-white/70 bg-white/80 text-gray-700 hover:border-primary/20 hover:text-gray-900'
                  }`}
                  title={label}
                >
                  <div
                    className={`absolute inset-0 transition ${
                      isActive ? `bg-gradient-to-br ${gradient}` : 'bg-transparent'
                    }`}
                  />
                  <div className="relative flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
                        isActive
                          ? 'border-white/30 bg-white/15 text-white'
                          : 'border-primary/10 bg-primary/5 text-primary'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col">
                      <span
                        className={`text-sm font-semibold ${
                          isActive ? 'text-white' : 'text-gray-900'
                        }`}
                      >
                        {label}
                      </span>
                      <span
                        className={`text-xs ${
                          isActive ? 'text-white/80' : 'text-gray-500'
                        }`}
                      >
                        {sublabel}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          {routeInfo && (
            <div className="rounded-2xl border border-white/20 bg-white/70 px-4 py-3 text-xs font-medium text-gray-600 shadow-inner backdrop-blur">
              <div className="flex items-center justify-between gap-6">
                <span>📏 {formatDistance(routeInfo.distance)}</span>
                <span>⏱️ {formatDuration(routeInfo.duration)}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Waypoint Planner */}
      <>
        {/* Desktop Panel - Slides in/out from left */}
        <div
          ref={desktopPanelRef}
          className={`hidden md:block absolute top-24 z-20 w-96 transition-all duration-300 ${
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
            pendingPin={pendingPin}
            onConfirmPending={handleConfirmPin}
            onCancelPending={handleCancelPin}
            className="w-full"
          />
        </div>

        {/* Desktop Toggle Button - Right edge of panel */}
        <button
          onClick={() => setIsDesktopPanelCollapsed(!isDesktopPanelCollapsed)}
          style={{ top: desktopToggleTop !== null ? desktopToggleTop : '50%' }}
          className={`hidden md:flex absolute -translate-y-1/2 z-30 w-8 h-16 bg-white hover:bg-gray-50 border border-gray-200 items-center justify-center rounded-r-lg shadow-md transition-all duration-300 ${
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
        <div className="md:hidden fixed left-0 right-0 bottom-0 z-40 transition-all duration-300">
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
            hasPendingPin={!!pendingPin}
            pendingPin={pendingPin}
            onConfirmPending={handleConfirmPin}
            onCancelPending={handleCancelPin}
            isMobile={true}
            isCollapsed={isPanelCollapsed}
            onToggleCollapse={() => setIsPanelCollapsed(!isPanelCollapsed)}
          />
        </div>
      </>

      {/* Create Trip Button - Bottom Right */}
      {hasRoute && (
        <div className="absolute bottom-20 right-8 z-20 flex md:bottom-8">
          <button
            onClick={handleCreateTrip}
            disabled={loading || waypoints.length === 0 || !destination}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-primary-dark px-6 py-3 text-sm font-semibold text-white shadow-[var(--shadow-soft)] transition hover:shadow-[var(--shadow-card)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CheckIcon className="w-5 h-5" />
            <span>Create Trip</span>
          </button>
        </div>
      )}

      {/* Route status card */}
      <div className="absolute bottom-8 left-8 z-20 hidden md:block">
        <div className="flex items-center gap-6 rounded-[26px] border border-white/40 bg-white/80 px-6 py-4 text-sm text-gray-600 shadow-[var(--shadow-soft)] backdrop-blur">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-gray-400">Stops</p>
            <p className="text-sm font-semibold text-gray-900">{totalStops || '—'}</p>
          </div>
          {routeInfo && (
            <>
              <div className="h-10 w-px bg-gray-200/70" />
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-gray-400">Distance</p>
                <p className="text-sm font-semibold text-gray-900">{formatDistance(routeInfo.distance)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-gray-400">ETA</p>
                <p className="text-sm font-semibold text-gray-900">{formatDuration(routeInfo.duration)}</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Click-to-add hint - Show at bottom center when no pending pin */}
      {!pendingPin && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 pointer-events-none md:bottom-8">
          <div className="rounded-full border border-white/40 bg-white/80 px-5 py-3 text-sm font-medium text-gray-600 shadow-[var(--shadow-soft)] backdrop-blur">
            Tap the map or search to drop a waypoint
          </div>
        </div>
      )}

      {/* Map View */}
      <MapView 
        height="100vh"
        showControls={true}
        initialCenter={mapCenter || [-122.45, 37.78]}
        initialZoom={mapCenter ? 15 : 10}
        onClick={handleMapClick}
        onMarkerDrag={handleMarkerDrag}
        // Pass route lines connecting waypoints
        routeLines={routeLines}
        // Pass waypoints and pending pin as markers
        markers={[
          // Pending pin (yellow/orange with next waypoint number, draggable)
          ...(pendingPin ? [{
            id: 'pending',
            lng: pendingPin.lng,
            lat: pendingPin.lat,
            label: `${waypoints.length + 1}`, // Show what number it will be
            color: '#f59e0b',
            draggable: true, // Allow dragging pending pin to adjust position
          }] : []),
          // Waypoints (green with numbers, draggable)
          ...waypoints.map((w, i) => ({
            id: w.id,
            lng: w.lng,
            lat: w.lat,
            label: `${i + 1}`,
            color: '#6b8e23',
            draggable: true,
          })),
          // Destination (red, draggable)
          ...(destination ? [{
            id: destination.id,
            lng: destination.lng,
            lat: destination.lat,
            label: '🎯',
            color: '#ef4444',
            draggable: true,
          }] : []),
        ]}
      />
    </div>
  );
}
