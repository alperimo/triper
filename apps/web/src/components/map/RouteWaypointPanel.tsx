/**
 * RouteWaypointPanel - Side panel for managing trip waypoints
 *
 * Features:
 * - Add up to 20 waypoints
 * - Drag to reorder waypoints
 * - Inline search for waypoints and destination
 * - Pending pin confirmation flow
 */

'use client';

import React, { useState } from 'react';
import {
  PlusIcon,
  XMarkIcon,
  MapPinIcon,
  ArrowsUpDownIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { RouteSearchBar } from './RouteSearchBar';

export interface Waypoint {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
}

interface RouteWaypointPanelProps {
  waypoints: Waypoint[];
  destination?: Waypoint;
  onChange: (waypoints: Waypoint[], destination?: Waypoint) => void;
  onSelectLocation?: (location: { lat: number; lng: number; name: string; address: string }) => void;
  onFocusWaypoint?: (waypoint: Waypoint) => void;
  onClose?: () => void;
  className?: string;
  maxWaypoints?: number;
  isMobile?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  hasPendingPin?: boolean;
  pendingPin?: {
    name: string;
    address: string;
    lat: number;
    lng: number;
  } | null;
  onConfirmPending?: () => void;
  onCancelPending?: () => void;
}

export function RouteWaypointPanel({
  waypoints,
  destination,
  onChange,
  onSelectLocation,
  onFocusWaypoint,
  onClose,
  className = '',
  maxWaypoints = 20,
  isMobile = false,
  isCollapsed = false,
  onToggleCollapse,
  hasPendingPin = false,
  pendingPin = null,
  onConfirmPending,
  onCancelPending,
}: RouteWaypointPanelProps) {
  const [expandedSearch, setExpandedSearch] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [previousWaypointsLength, setPreviousWaypointsLength] = useState(waypoints.length);

  // Close search field when a waypoint is actually added (after pin confirmation)
  React.useEffect(() => {
    if (waypoints.length > previousWaypointsLength) {
      setExpandedSearch(null);
    }
    setPreviousWaypointsLength(waypoints.length);
  }, [waypoints.length, previousWaypointsLength]);

  const addWaypoint = () => {
    if (waypoints.length >= maxWaypoints || hasPendingPin) return;
    const newId = `waypoint-${Date.now()}`;
    setExpandedSearch(newId);
  };

  const setWaypoint = (index: number, location: { lat: number; lng: number; name: string; address: string }) => {
    if (onSelectLocation) {
      onSelectLocation(location);
      return;
    }

    const newWaypoints = [...waypoints];
    newWaypoints[index] = {
      id: newWaypoints[index]?.id || `waypoint-${Date.now()}`,
      ...location,
    };
    onChange(newWaypoints, destination);
    setExpandedSearch(null);
  };

  const setDestinationWaypoint = (location: { lat: number; lng: number; name: string; address: string }) => {
    if (onSelectLocation) {
      onSelectLocation(location);
      return;
    }

    const newDestination: Waypoint = {
      id: 'destination',
      ...location,
    };
    onChange(waypoints, newDestination);
    setExpandedSearch(null);
  };

  const addDestination = () => {
    if (hasPendingPin) return;
    setExpandedSearch('destination');
  };

  const removeWaypoint = (index: number) => {
    const newWaypoints = waypoints.filter((_, i) => i !== index);
    onChange(newWaypoints, destination);
  };

  const removeDestination = () => {
    onChange(waypoints, undefined);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newWaypoints = [...waypoints];
    const draggedItem = newWaypoints[draggedIndex];
    newWaypoints.splice(draggedIndex, 1);
    newWaypoints.splice(index, 0, draggedItem);

    onChange(newWaypoints, destination);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const totalDistance = React.useMemo(() => {
    if (waypoints.length < 2 && !destination) return null;

    let distance = 0;
    const allPoints = [...waypoints, destination].filter(Boolean) as Waypoint[];

    for (let i = 0; i < allPoints.length - 1; i++) {
      const p1 = allPoints[i];
      const p2 = allPoints[i + 1];
      const dx = p2.lng - p1.lng;
      const dy = p2.lat - p1.lat;
      distance += Math.sqrt(dx * dx + dy * dy) * 111;
    }

    return distance;
  }, [waypoints, destination]);

  const hasPlannedStops = waypoints.length > 0 || !!destination;
  const headerSubtitle = hasPlannedStops
    ? `${waypoints.length} waypoint${waypoints.length === 1 ? '' : 's'}${destination ? ' + destination' : ''}`
    : 'Drop encrypted points to begin planning';
  const showEmptyState = waypoints.length === 0 && !destination && !hasPendingPin && !expandedSearch;
  const desktopMaxHeight = 'calc(100vh - 14rem)';
  const containerMaxHeight = isMobile ? (isCollapsed ? 'auto' : '80vh') : desktopMaxHeight;

  return (
    <div
      className={`relative flex flex-col border border-white/40 bg-white/80 ${isMobile ? 'rounded-t-[32px]' : 'rounded-[32px]'} shadow-[var(--shadow-card)] backdrop-blur-xl ${className}`}
      style={{
        maxHeight: containerMaxHeight,
        touchAction: 'none',
      }}
    >
      {isMobile && (
        <button
          onClick={onToggleCollapse}
          className="flex justify-center pt-3 pb-2"
          style={{ touchAction: 'none' }}
        >
          <div className="h-1.5 w-12 rounded-full bg-gray-300" />
        </button>
      )}

      <div className="flex items-center justify-between gap-3 px-5 py-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Route Planner</h3>
          <p className="text-xs text-gray-500">{headerSubtitle}</p>
        </div>
        {!isMobile && (
          <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            Privacy on
          </span>
        )}
        {isMobile && onClose && (
          <button
            onClick={onClose}
            className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-600 shadow-sm"
          >
            Close
          </button>
        )}
      </div>

      {isMobile && isCollapsed ? (
        <div className="px-5 pb-6 text-sm text-gray-500">
          Swipe up to add encrypted stops and shape your itinerary.
        </div>
      ) : (
        <div className="flex-1 space-y-4 overflow-y-auto px-5 pb-6" style={{ touchAction: 'pan-y' }}>
          {pendingPin && (
            <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-4 text-sm text-primary shadow-[var(--shadow-soft)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-primary/70">Pending location</p>
                  <p className="mt-1 font-semibold text-primary">{pendingPin.name}</p>
                  <p className="text-xs text-primary/80">{pendingPin.address}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={onCancelPending}
                    className="rounded-full border border-primary/10 bg-white px-3 py-2 text-xs font-semibold text-primary transition hover:bg-primary/10"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={onConfirmPending}
                    className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-primary to-primary-dark px-3 py-2 text-xs font-semibold text-white shadow-[var(--shadow-soft)] transition hover:shadow-[var(--shadow-card)]"
                  >
                    <CheckIcon className="h-4 w-4" />
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          )}

          {showEmptyState ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-primary/30 bg-white/70 px-6 py-10 text-center shadow-[var(--shadow-soft)]">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <MapPinIcon className="h-6 w-6" />
              </div>
              <p className="mb-2 text-base font-semibold text-gray-900">Map ready for your first waypoint</p>
              <p className="mb-4 text-sm text-gray-500">
                Search above or drop a pin on the map to start building your encrypted itinerary.
              </p>
              <button
                onClick={addWaypoint}
                disabled={hasPendingPin}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-primary-dark px-5 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-soft)] transition hover:shadow-[var(--shadow-card)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <PlusIcon className="h-4 w-4" />
                Add starting point
              </button>
            </div>
          ) : (
            <>
              {waypoints.map((waypoint, index) => (
                <div
                  key={waypoint.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`group relative rounded-2xl border border-white/50 bg-white/85 p-4 shadow-sm transition ${
                    draggedIndex === index ? 'opacity-50' : 'hover:border-primary/30 hover:shadow-[var(--shadow-soft)]'
                  }`}
                >

                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-sm font-semibold text-primary">
                      {index + 1}
                    </div>
                    <button
                      onClick={() => {
                        if (onFocusWaypoint) onFocusWaypoint(waypoint);
                      }}
                      className="flex-1 min-w-0 text-left"
                    >
                      <p className="font-semibold text-gray-900">{waypoint.name}</p>
                      <p className="text-xs text-gray-500">{waypoint.address}</p>
                    </button>
                    <button
                      onClick={() => removeWaypoint(index)}
                      className="rounded-full border border-transparent bg-white/70 p-2 text-gray-400 transition hover:text-red-500"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}

              {expandedSearch && expandedSearch.startsWith('waypoint-') && waypoints.length < maxWaypoints && (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-white/70 p-4 shadow-sm">
                  <div className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-600">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-gray-600">
                      {waypoints.length + 1}
                    </div>
                    <span>Add waypoint</span>
                  </div>
                  <RouteSearchBar
                    onSelectLocation={(location) => {
                      setWaypoint(waypoints.length, location);
                    }}
                    placeholder="Search for waypoint…"
                    fullWidthDropdown={true}
                    className="w-full"
                  />
                  <div className="mt-3 text-right">
                    <button
                      onClick={() => setExpandedSearch(null)}
                      className="text-xs font-medium text-gray-500 hover:text-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {waypoints.length < maxWaypoints && !expandedSearch?.startsWith('waypoint-') && (
                <button
                  onClick={addWaypoint}
                  disabled={hasPendingPin}
                  className={`w-full rounded-2xl border border-dashed px-5 py-4 text-sm font-semibold transition ${
                    hasPendingPin
                      ? 'border-gray-200 text-gray-400'
                      : 'border-primary/30 text-primary hover:border-primary/50 hover:bg-primary/5'
                  }`}
                >
                  {hasPendingPin
                    ? 'Confirm or cancel the pending location'
                    : waypoints.length === 0
                      ? 'Add starting point'
                      : 'Add another waypoint'}
                </button>
              )}

              {waypoints.length > 0 && (
                <>
                  <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

                  {destination ? (
                    <div className="relative rounded-2xl border border-red-200/60 bg-red-50/70 p-4 shadow-sm">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-500 text-white">
                          <MapPinIcon className="h-5 w-5" />
                        </div>
                        <button
                          onClick={() => {
                            if (onFocusWaypoint) onFocusWaypoint(destination);
                          }}
                          className="flex-1 min-w-0 text-left"
                        >
                          <p className="font-semibold text-gray-900">{destination.name}</p>
                          <p className="text-xs text-gray-600">{destination.address}</p>
                        </button>
                        <button
                          onClick={removeDestination}
                          className="rounded-full border border-transparent bg-white/70 p-2 text-gray-400 transition hover:text-red-500"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ) : expandedSearch === 'destination' ? (
                    <div className="rounded-2xl border border-dashed border-red-300 bg-white/70 p-4 shadow-sm">
                      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-red-600">
                        <MapPinIcon className="h-5 w-5" />
                        <span>Add destination</span>
                      </div>
                      <RouteSearchBar
                        onSelectLocation={setDestinationWaypoint}
                        placeholder="Search for destination…"
                        fullWidthDropdown={true}
                        className="w-full"
                      />
                      <div className="mt-3 text-right">
                        <button
                          onClick={() => setExpandedSearch(null)}
                          className="text-xs font-medium text-gray-500 hover:text-gray-700"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={addDestination}
                      disabled={hasPendingPin}
                      className={`w-full rounded-2xl border border-dashed px-5 py-4 text-sm font-semibold transition ${
                        hasPendingPin
                          ? 'border-gray-200 text-gray-400'
                          : 'border-red-300 text-red-600 hover:border-red-400 hover:bg-red-50'
                      }`}
                    >
                      {hasPendingPin ? 'Confirm or cancel the pending location' : 'Add destination'}
                    </button>
                  )}
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
