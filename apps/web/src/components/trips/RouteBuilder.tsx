// Map-based Route Builder Component with H3 Geospatial Integration
'use client';

import { useEffect, useRef } from 'react';
import { MapPin, Trash2, Flag } from 'lucide-react';
import { latLngToH3Cell, h3CellToLatLng, formatH3Index } from '@/lib/geo/h3';
import type { Waypoint } from '@/types';

interface RouteBuilderProps {
  waypoints: Waypoint[];
  destination?: Waypoint;
  onChange: (waypoints: Waypoint[], destination?: Waypoint) => void;
  maxWaypoints?: number;
}

export function RouteBuilder({ waypoints, destination, onChange, maxWaypoints = 20 }: RouteBuilderProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  // TODO: Integrate with actual map library (Leaflet, Mapbox, etc.)
  // For now, show a placeholder with manual input

  const addWaypoint = (lat: number, lng: number) => {
    if (waypoints.length >= maxWaypoints) {
      alert(`Maximum ${maxWaypoints} waypoints allowed`);
      return;
    }
    
    // Convert to H3 cell and back to get cell center
    const h3Cell = latLngToH3Cell(lat, lng);
    const cellCenter = h3CellToLatLng(h3Cell);
    
    onChange([...waypoints, cellCenter], destination);
  };

  const setDestination = (lat: number, lng: number) => {
    const h3Cell = latLngToH3Cell(lat, lng);
    const cellCenter = h3CellToLatLng(h3Cell);
    
    onChange(waypoints, cellCenter);
  };

  const removeWaypoint = (index: number) => {
    onChange(waypoints.filter((_, i) => i !== index), destination);
  };

  const clearDestination = () => {
    onChange(waypoints, undefined);
  };

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Mock: Convert click position to lat/lng
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Simple mock conversion (replace with actual map library)
    const lat = 50 - (y / rect.height) * 40; // Range: 50 to 10
    const lng = -10 + (x / rect.width) * 60; // Range: -10 to 50
    
    // Check if shift key is pressed for destination
    if (e.shiftKey) {
      setDestination(Number(lat.toFixed(4)), Number(lng.toFixed(4)));
    } else {
      addWaypoint(Number(lat.toFixed(4)), Number(lng.toFixed(4)));
    }
  };

  return (
    <div className="space-y-4">
      {/* Map Container */}
      <div
        ref={mapRef}
        onClick={handleMapClick}
        className="relative w-full h-96 bg-gray-800 rounded-lg border-2 border-gray-700 cursor-crosshair overflow-hidden"
      >
        {/* Mock Map Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 via-gray-750 to-gray-800">
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }} />
        </div>

        {/* Instructions */}
        {waypoints.length === 0 && !destination && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-gray-400">
              <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">Click to add waypoints (H3 cells)</p>
              <p className="text-sm mt-1">Shift + Click to set destination</p>
              <p className="text-xs mt-2 text-gray-500">Using H3 resolution 7 (~5 km² cells)</p>
            </div>
          </div>
        )}

        {/* Route Visualization */}
        {waypoints.length > 0 && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {/* Draw lines between waypoints */}
            {waypoints.map((point, i) => {
              if (i === 0) return null;
              const prev = waypoints[i - 1];
              
              // Mock position calculation (replace with actual map projection)
              const x1 = ((prev.lng + 10) / 60) * 100;
              const y1 = ((50 - prev.lat) / 40) * 100;
              const x2 = ((point.lng + 10) / 60) * 100;
              const y2 = ((50 - point.lat) / 40) * 100;
              
              return (
                <line
                  key={i}
                  x1={`${x1}%`}
                  y1={`${y1}%`}
                  x2={`${x2}%`}
                  y2={`${y2}%`}
                  stroke="#3b82f6"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray="5,5"
                />
              );
            })}
            
            {/* Line to destination */}
            {destination && waypoints.length > 0 && (() => {
              const lastWaypoint = waypoints[waypoints.length - 1];
              const x1 = ((lastWaypoint.lng + 10) / 60) * 100;
              const y1 = ((50 - lastWaypoint.lat) / 40) * 100;
              const x2 = ((destination.lng + 10) / 60) * 100;
              const y2 = ((50 - destination.lat) / 40) * 100;
              
              return (
                <line
                  x1={`${x1}%`}
                  y1={`${y1}%`}
                  x2={`${x2}%`}
                  y2={`${y2}%`}
                  stroke="#10b981"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray="5,5"
                />
              );
            })()}
          </svg>
        )}

        {/* Waypoint Markers */}
        {waypoints.map((point, i) => {
          // Mock position calculation
          const x = ((point.lng + 10) / 60) * 100;
          const y = ((50 - point.lat) / 40) * 100;
          const h3Cell = latLngToH3Cell(point.lat, point.lng);
          
          return (
            <div
              key={i}
              className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              <div className="relative group">
                <div className="w-8 h-8 bg-blue-600 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-xs font-bold">
                  {i + 1}
                </div>
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  H3: {formatH3Index(h3Cell)}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeWaypoint(i);
                  }}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
        
        {/* Destination Marker */}
        {destination && (() => {
          const x = ((destination.lng + 10) / 60) * 100;
          const y = ((50 - destination.lat) / 40) * 100;
          const h3Cell = latLngToH3Cell(destination.lat, destination.lng);
          
          return (
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              <div className="relative group">
                <div className="w-10 h-10 bg-green-600 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                  <Flag className="w-5 h-5 text-white" />
                </div>
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  Destination (H3: {formatH3Index(h3Cell)})
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    clearDestination();
                  }}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Info Panel */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Waypoints */}
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Waypoints ({waypoints.length}/{maxWaypoints})
            </h4>
            {waypoints.length > 0 ? (
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {waypoints.map((point, i) => {
                  const h3Cell = latLngToH3Cell(point.lat, point.lng);
                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between text-sm bg-gray-750 rounded px-3 py-2"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                          {i + 1}
                        </span>
                        <div>
                          <div className="font-mono text-gray-300 text-xs">
                            {formatH3Index(h3Cell)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {point.lat.toFixed(4)}, {point.lng.toFixed(4)}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => removeWaypoint(i)}
                        className="p-1 hover:bg-gray-700 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Click on map to add waypoints</p>
            )}
          </div>
          
          {/* Destination */}
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Flag className="w-4 h-4" />
              Destination
            </h4>
            {destination ? (
              <div className="flex items-center justify-between text-sm bg-green-900/20 border border-green-700 rounded px-3 py-2">
                <div>
                  <div className="font-mono text-gray-300 text-xs">
                    {formatH3Index(latLngToH3Cell(destination.lat, destination.lng))}
                  </div>
                  <div className="text-xs text-gray-500">
                    {destination.lat.toFixed(4)}, {destination.lng.toFixed(4)}
                  </div>
                  {destination.name && (
                    <div className="text-xs text-gray-400 mt-1">{destination.name}</div>
                  )}
                </div>
                <button
                  onClick={clearDestination}
                  className="p-1 hover:bg-gray-700 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Shift + Click to set destination</p>
            )}
          </div>
        </div>
        
        {/* H3 Info */}
        <div className="mt-4 pt-4 border-t border-gray-700 text-xs text-gray-500">
          <p>
            <strong>H3 Geospatial:</strong> Waypoints use ~5 km² cells (resolution 7). 
            Destination uses ~36 km² for pre-filtering (resolution 6).
          </p>
        </div>
      </div>
    </div>
  );
}
