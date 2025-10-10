'use client';

import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { EncryptedAura } from './EncryptedAura';
import { useMatchStore } from '@/lib/store/match';

export function MapView() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const { encryptedAuras, setSelectedMatch, matches } = useMatchStore();
  
  useEffect(() => {
    if (!mapContainer.current || map.current) return;
    
    // Initialize map
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'osm-tiles': {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors',
          },
        },
        layers: [
          {
            id: 'osm-tiles',
            type: 'raster',
            source: 'osm-tiles',
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
      center: [13.4050, 52.5200], // Berlin as default
      zoom: 10,
    });
    
    map.current.on('load', () => {
      setMapLoaded(true);
    });
    
    // Add navigation controls
    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');
    
    return () => {
      map.current?.remove();
    };
  }, []);
  
  const handleAuraClick = (matchId: string) => {
    const match = matches.find(m => m.id === matchId);
    if (match) {
      setSelectedMatch(match);
    }
  };
  
  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />
      
      {mapLoaded && encryptedAuras.map((aura) => (
        <EncryptedAura
          key={aura.matchId}
          position={aura.position}
          matchScore={aura.matchScore}
          distance={`${aura.approximateDistance.toFixed(0)}km`}
          onClick={() => handleAuraClick(aura.matchId)}
        />
      ))}
      
      {/* Map overlay UI */}
      <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-lg">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-medium">Encrypted Travel Matches</span>
        </div>
        <p className="text-xs text-white/70 mt-1">
          {encryptedAuras.length} potential companions nearby
        </p>
      </div>
    </div>
  );
}
