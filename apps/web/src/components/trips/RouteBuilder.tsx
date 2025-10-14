/**
 * RouteBuilder Component - Interactive route planning with MapLibre GL + H3
 * 
 * Features:
 * - Click to add waypoints (up to 20)
 * - Shift + Click to set destination
 * - Displays H3 cells for privacy
 * - Shows route lines
 * - Remove waypoints
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import { MapPin, Trash2, Flag, Info } from 'lucide-react';
import { MapView } from '../map/MapView';
import { latLngToH3Cell, h3CellToLatLng, formatH3Index } from '@/lib/geo/h3';
import type { Waypoint, H3Index } from '@/types';

interface RouteBuilderProps {
  waypoints?: Waypoint[];
  destination?: Waypoint;
  onChange: (waypoints: Waypoint[], destination?: Waypoint) => void;
  maxWaypoints?: number;
}

export function RouteBuilder({ 
  waypoints = [], 
  destination, 
  onChange, 
  maxWaypoints = 20 
}: RouteBuilderProps) {
  const [hoveredH3, setHoveredH3] = useState<string | null>(null);

  /**
   * Handle map click - add waypoint or set destination
   */
  const handleMapClick = useCallback((event: { lng: number; lat: number; lngLat: [number, number] }) => {
    const { lat, lng } = event;
    
    // Convert to H3 cell and back to get cell center
    const h3Cell = latLngToH3Cell(lat, lng);
    const cellCenter = h3CellToLatLng(h3Cell);
    
    // Check if this is a destination click (Shift key)
    // Note: We can't detect Shift in the click callback, so we'll use a button instead
    // For now, always add as waypoint
    
    if (waypoints.length >= maxWaypoints) {
      alert(`Maximum ${maxWaypoints} waypoints allowed`);
      return;
    }
    
    onChange([...waypoints, cellCenter], destination);
  }, [waypoints, destination, onChange, maxWaypoints]);

  /**
   * Add waypoint from coordinates
   */
  const addWaypoint = useCallback((lat: number, lng: number) => {
    if (waypoints.length >= maxWaypoints) {
      alert(`Maximum ${maxWaypoints} waypoints allowed`);
      return;
    }
    
    const h3Cell = latLngToH3Cell(lat, lng);
    const cellCenter = h3CellToLatLng(h3Cell);
    
    onChange([...waypoints, cellCenter], destination);
  }, [waypoints, destination, onChange, maxWaypoints]);

  /**
   * Set destination from coordinates
   */
  const setDestinationPoint = useCallback((lat: number, lng: number) => {
    const h3Cell = latLngToH3Cell(lat, lng);
    const cellCenter = h3CellToLatLng(h3Cell);
    
    onChange(waypoints, cellCenter);
  }, [waypoints, onChange]);

  /**
   * Remove waypoint
   */
  const removeWaypoint = useCallback((index: number) => {
    onChange(waypoints.filter((_, i) => i !== index), destination);
  }, [waypoints, destination, onChange]);

  /**
   * Clear destination
   */
  const clearDestination = useCallback(() => {
    onChange(waypoints, undefined);
  }, [waypoints, onChange]);

  /**
   * Convert waypoints to H3 cells for visualization
   */
  const h3Cells = useMemo(() => {
    return waypoints.map((point, idx) => ({
      h3Index: latLngToH3Cell(point.lat, point.lng),
      color: idx === 0 ? '#10b981' : '#3b82f6', // First waypoint green, others blue
      opacity: 0.3,
    }));
  }, [waypoints]);

  /**
   * Convert destination to H3 cell
   */
  const destinationH3 = useMemo(() => {
    if (!destination) return [];
    return [{
      h3Index: latLngToH3Cell(destination.lat, destination.lng),
      color: '#ef4444', // Red for destination
      opacity: 0.4,
    }];
  }, [destination]);

  /**
   * Markers for waypoints and destination
   */
  const markers = useMemo(() => {
    const allMarkers = [];
    
    // Waypoint markers
    waypoints.forEach((point, idx) => {
      allMarkers.push({
        lng: point.lng,
        lat: point.lat,
        label: `${idx + 1}`,
        color: idx === 0 ? '#10b981' : '#3b82f6',
      });
    });
    
    // Destination marker
    if (destination) {
      allMarkers.push({
        lng: destination.lng,
        lat: destination.lat,
        label: '🏁',
        color: '#ef4444',
      });
    }
    
    return allMarkers;
  }, [waypoints, destination]);

  /**
   * Calculate map center
   */
  const mapCenter = useMemo((): [number, number] => {
    if (destination) return [destination.lng, destination.lat];
    if (waypoints.length > 0) {
      const last = waypoints[waypoints.length - 1];
      return [last.lng, last.lat];
    }
    return [-122.45, 37.78]; // Default: San Francisco
  }, [waypoints, destination]);

  return (
    <div className="space-y-4">
      {/* Map Container */}
      <div className="relative w-full h-[500px] rounded-lg overflow-hidden border-2 border-gray-700">
        <MapView
          initialCenter={mapCenter}
          initialZoom={waypoints.length > 0 ? 8 : 10}
          height="100%"
          onClick={handleMapClick}
          showControls={true}
          h3Cells={[...h3Cells, ...destinationH3]}
          markers={markers}
        />

        {/* Instructions Overlay */}
        {waypoints.length === 0 && !destination && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-white bg-black/60 backdrop-blur-sm p-6 rounded-lg">
              <MapPin className="w-12 h-12 mx-auto mb-3" />
              <p className="font-medium text-lg">Click to add waypoints</p>
              <p className="text-sm mt-2">Using H3 resolution 7 (~5 km² cells)</p>
              <p className="text-xs mt-2 text-gray-300">
                Use buttons below to set destination
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Info Panel - Waypoints List */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Waypoints Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Waypoints ({waypoints.length}/{maxWaypoints})
              </h3>
            </div>
            
            {waypoints.length === 0 ? (
              <p className="text-xs text-gray-500">No waypoints added yet</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {waypoints.map((point, idx) => {
                  const h3Cell = latLngToH3Cell(point.lat, point.lng);
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-gray-700/50 p-2 rounded text-xs"
                    >
                      <div className="flex-1">
                        <div className="font-mono text-blue-400">
                          {idx + 1}. {formatH3Index(h3Cell)}
                        </div>
                        <div className="text-gray-400 mt-0.5">
                          {point.lat.toFixed(4)}, {point.lng.toFixed(4)}
                        </div>
                      </div>
                      <button
                        onClick={() => removeWaypoint(idx)}
                        className="p-1 hover:bg-red-500/20 rounded transition-colors"
                        title="Remove waypoint"
                      >
                        <Trash2 className="w-3 h-3 text-red-400" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Destination Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                <Flag className="w-4 h-4" />
                Destination
              </h3>
            </div>
            
            {!destination ? (
              <p className="text-xs text-gray-500">No destination set</p>
            ) : (
              <div className="space-y-2">
                <div className="bg-gray-700/50 p-2 rounded text-xs">
                  <div className="font-mono text-green-400">
                    {formatH3Index(latLngToH3Cell(destination.lat, destination.lng))}
                  </div>
                  <div className="text-gray-400 mt-0.5">
                    {destination.lat.toFixed(4)}, {destination.lng.toFixed(4)}
                  </div>
                  <button
                    onClick={clearDestination}
                    className="mt-2 text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    Clear destination
                  </button>
                </div>
              </div>
            )}
            
            {/* Quick Action: Set Last Waypoint as Destination */}
            {waypoints.length > 0 && !destination && (
              <button
                onClick={() => {
                  const last = waypoints[waypoints.length - 1];
                  setDestinationPoint(last.lat, last.lng);
                  onChange(waypoints.slice(0, -1), { ...last });
                }}
                className="mt-3 w-full text-xs bg-green-600 hover:bg-green-700 px-3 py-2 rounded transition-colors"
              >
                Use last waypoint as destination
              </button>
            )}
          </div>
        </div>

        {/* H3 Info */}
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="flex items-start gap-2 text-xs text-gray-400">
            <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-300">H3 Privacy Layer</p>
              <p className="mt-1">
                Waypoints use H3 resolution 7 (~5 km² per cell, ~2.5 km edge).
                Destination uses resolution 6 (~36 km² per cell) for pre-filtering.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

