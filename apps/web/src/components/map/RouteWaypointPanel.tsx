/**
 * RouteWaypointPanel - Side panel for managing trip waypoints
 * 
 * Features:
 * - Add up to 20 waypoints
 * - Dynamic "Add route" buttons
 * - Drag to reorder waypoints
 * - Remove waypoints
 * - Search integration for each waypoint
 */

'use client';

import React, { useState } from 'react';
import { 
  PlusIcon, 
  XMarkIcon, 
  MapPinIcon,
  ArrowsUpDownIcon,
  TrashIcon,
  CheckIcon
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
  onFocusWaypoint?: (waypoint: Waypoint) => void;
  onClose?: () => void;
  className?: string;
  maxWaypoints?: number;
}

export function RouteWaypointPanel({
  waypoints,
  destination,
  onChange,
  onFocusWaypoint,
  onClose,
  className = '',
  maxWaypoints = 20,
}: RouteWaypointPanelProps) {
  const [expandedSearch, setExpandedSearch] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const addWaypoint = () => {
    if (waypoints.length >= maxWaypoints) return;
    
    const newId = `waypoint-${Date.now()}`;
    setExpandedSearch(newId);
    // Don't add to waypoints yet, wait for user to search
  };

  const setWaypoint = (index: number, location: { lat: number; lng: number; name: string; address: string }) => {
    const newWaypoints = [...waypoints];
    newWaypoints[index] = {
      id: newWaypoints[index]?.id || `waypoint-${Date.now()}`,
      ...location,
    };
    onChange(newWaypoints, destination);
    setExpandedSearch(null);
  };

  const setDestinationWaypoint = (location: { lat: number; lng: number; name: string; address: string }) => {
    const newDestination: Waypoint = {
      id: 'destination',
      ...location,
    };
    onChange(waypoints, newDestination);
    setExpandedSearch(null);
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
    
    // Calculate approximate distance (rough estimation)
    let distance = 0;
    const allPoints = [...waypoints, destination].filter(Boolean) as Waypoint[];
    
    for (let i = 0; i < allPoints.length - 1; i++) {
      const p1 = allPoints[i];
      const p2 = allPoints[i + 1];
      const dx = p2.lng - p1.lng;
      const dy = p2.lat - p1.lat;
      distance += Math.sqrt(dx * dx + dy * dy) * 111; // Rough km conversion
    }
    
    return distance;
  }, [waypoints, destination]);

  return (
    <div className={`bg-white/95 backdrop-blur-sm shadow-xl rounded-lg border border-gray-200 flex flex-col ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Plan Your Route</h3>
          <p className="text-sm text-gray-500 mt-1">
            Add up to {maxWaypoints} waypoints
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            title="Close panel"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Waypoints List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {/* Waypoints */}
        {waypoints.map((waypoint, index) => (
          <div
            key={waypoint.id}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={`relative group ${
              draggedIndex === index ? 'opacity-50' : ''
            }`}
          >
            <div className="flex items-start gap-2">
              {/* Drag Handle */}
              <button className="flex-shrink-0 w-8 h-8 mt-2 flex items-center justify-center text-gray-400 hover:text-gray-600 cursor-move">
                <ArrowsUpDownIcon className="w-4 h-4" />
              </button>

              {/* Number Badge */}
              <div className="flex-shrink-0 w-8 h-8 mt-2 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                {index + 1}
              </div>

              {/* Waypoint Info */}
              <button
                onClick={() => {
                  if (onFocusWaypoint) onFocusWaypoint(waypoint);
                }}
                className="flex-1 min-w-0 px-3 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left"
              >
                <div className="font-medium text-gray-900 truncate">{waypoint.name}</div>
                <div className="text-xs text-gray-500 truncate">{waypoint.address}</div>
              </button>

              {/* Remove Button */}
              <button
                onClick={() => removeWaypoint(index)}
                className="flex-shrink-0 w-8 h-8 mt-2 flex items-center justify-center text-gray-400 hover:text-red-600 transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}

        {/* Add Waypoint Search */}
        {expandedSearch && expandedSearch.startsWith('waypoint-') && waypoints.length < maxWaypoints && (
          <div className="flex items-start gap-2">
            <div className="flex-shrink-0 w-8 h-8 mt-2"></div>
            <div className="flex-shrink-0 w-8 h-8 mt-2 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center text-sm font-medium">
              {waypoints.length + 1}
            </div>
            <div className="flex-1">
              <RouteSearchBar
                onSelectLocation={(location) => {
                  setWaypoint(waypoints.length, location);
                }}
                placeholder="Search for waypoint..."
              />
            </div>
            <button
              onClick={() => setExpandedSearch(null)}
              className="flex-shrink-0 w-8 h-8 mt-2 flex items-center justify-center text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Add Waypoint Button */}
        {waypoints.length < maxWaypoints && !expandedSearch?.startsWith('waypoint-') && (
          <button
            onClick={addWaypoint}
            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-purple-400 hover:text-purple-600 transition-colors flex items-center justify-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            <span className="font-medium">
              {waypoints.length === 0 ? 'Add starting point' : 'Add waypoint'}
            </span>
          </button>
        )}

        {/* Destination */}
        {waypoints.length > 0 && (
          <>
            <div className="border-t border-gray-200 my-4"></div>
            
            {destination ? (
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0 w-8 h-8 mt-2"></div>
                <div className="flex-shrink-0 w-8 h-8 mt-2 bg-red-500 text-white rounded-full flex items-center justify-center">
                  <MapPinIcon className="w-5 h-5" />
                </div>
                <button
                  onClick={() => {
                    if (onFocusWaypoint) onFocusWaypoint(destination);
                  }}
                  className="flex-1 min-w-0 px-3 py-2 bg-red-50 rounded-lg hover:bg-red-100 transition-colors text-left"
                >
                  <div className="font-medium text-gray-900 truncate">{destination.name}</div>
                  <div className="text-xs text-gray-500 truncate">{destination.address}</div>
                </button>
                <button
                  onClick={removeDestination}
                  className="flex-shrink-0 w-8 h-8 mt-2 flex items-center justify-center text-gray-400 hover:text-red-600 transition-colors"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            ) : expandedSearch === 'destination' ? (
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0 w-8 h-8 mt-2"></div>
                <div className="flex-shrink-0 w-8 h-8 mt-2 bg-red-500 text-white rounded-full flex items-center justify-center">
                  <MapPinIcon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <RouteSearchBar
                    onSelectLocation={setDestinationWaypoint}
                    placeholder="Search for destination..."
                  />
                </div>
                <button
                  onClick={() => setExpandedSearch(null)}
                  className="flex-shrink-0 w-8 h-8 mt-2 flex items-center justify-center text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setExpandedSearch('destination')}
                className="w-full py-3 border-2 border-dashed border-red-300 rounded-lg text-red-600 hover:border-red-400 hover:text-red-700 transition-colors flex items-center justify-center gap-2"
              >
                <MapPinIcon className="w-5 h-5" />
                <span className="font-medium">Add destination</span>
              </button>
            )}
          </>
        )}
      </div>

      {/* Footer with Stats */}
      {(waypoints.length > 0 || destination) && (
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm">
            <div className="text-gray-600">
              {waypoints.length} waypoint{waypoints.length !== 1 ? 's' : ''}
              {destination && ' + destination'}
            </div>
            {totalDistance && (
              <div className="font-medium text-gray-900">
                ~{Math.round(totalDistance)} km
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
