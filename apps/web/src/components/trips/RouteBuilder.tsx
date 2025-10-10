// Map-based Route Builder Component
'use client';

import { useEffect, useRef } from 'react';
import { MapPin, Trash2 } from 'lucide-react';

interface RouteBuilderProps {
  route: Array<{ lat: number; lng: number }>;
  onChange: (route: Array<{ lat: number; lng: number }>) => void;
}

export function RouteBuilder({ route, onChange }: RouteBuilderProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  // TODO: Integrate with actual map library (Leaflet, Mapbox, etc.)
  // For now, show a placeholder with manual input

  const addWaypoint = (lat: number, lng: number) => {
    onChange([...route, { lat, lng }]);
  };

  const removeWaypoint = (index: number) => {
    onChange(route.filter((_, i) => i !== index));
  };

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Mock: Convert click position to lat/lng
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Simple mock conversion (replace with actual map library)
    const lat = 50 - (y / rect.height) * 40; // Range: 50 to 10
    const lng = -10 + (x / rect.width) * 60; // Range: -10 to 50
    
    addWaypoint(Number(lat.toFixed(4)), Number(lng.toFixed(4)));
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
        {route.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-gray-400">
              <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">Click on the map to add waypoints</p>
              <p className="text-sm mt-1">Build your travel route step by step</p>
            </div>
          </div>
        )}

        {/* Route Visualization */}
        {route.length > 0 && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {/* Draw lines between waypoints */}
            {route.map((point, i) => {
              if (i === 0) return null;
              const prev = route[i - 1];
              
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
          </svg>
        )}

        {/* Waypoint Markers */}
        {route.map((point, i) => {
          // Mock position calculation
          const x = ((point.lng + 10) / 60) * 100;
          const y = ((50 - point.lat) / 40) * 100;
          
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
      </div>

      {/* Waypoint List */}
      {route.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-4">
          <h4 className="text-sm font-semibold mb-3">Route Waypoints ({route.length})</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {route.map((point, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-sm bg-gray-750 rounded px-3 py-2"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                    {i + 1}
                  </span>
                  <span className="font-mono text-gray-300">
                    {point.lat.toFixed(4)}, {point.lng.toFixed(4)}
                  </span>
                </div>
                <button
                  onClick={() => removeWaypoint(i)}
                  className="p-1 hover:bg-gray-700 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-gray-500 italic">
        Note: In production, this will use a real map library (Leaflet/Mapbox) with geocoding
      </p>
    </div>
  );
}
