/**
 * MapView Component - Interactive map using MapLibre GL + H3
 * 
 * Features:
 * - Display base map with OpenStreetMap tiles
 * - Show H3 cells (blurred locations for privacy)
 * - Display nearby trips
 * - Interactive controls
 * - Click to get coordinates
 */

'use client';

import React, { useRef, useCallback, useState } from 'react';
import Map, { 
  MapRef,
  NavigationControl,
  GeolocateControl,
  ScaleControl,
  FullscreenControl,
  Layer,
  Source,
  Marker,
} from 'react-map-gl/maplibre';
import type { ViewState, MapLayerMouseEvent } from 'react-map-gl/maplibre';
import type { StyleSpecification } from 'maplibre-gl';
import { cellToBoundary } from 'h3-js';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useMatchStore } from '@/lib/store/match';
import type { H3Index } from '@/types';
import triperRadiantStyle from './styles/triper-radiant.json';

export interface MapViewProps {
  /** Initial center of the map [lng, lat] */
  initialCenter?: [number, number];
  /** Initial zoom level */
  initialZoom?: number;
  /** Height of the map container */
  height?: string;
  /** Callback when map is clicked */
  onClick?: (event: { lng: number; lat: number; lngLat: [number, number] }) => void;
  /** Whether to show navigation controls */
  showControls?: boolean;
  /** H3 cells to display (for privacy-blurred locations) */
  h3Cells?: Array<{ h3Index: H3Index; color?: string; opacity?: number }>;
  /** Markers to display */
  markers?: Array<{ lng: number; lat: number; label?: string; color?: string; id?: string; draggable?: boolean }>;
  /** Callback when a marker is dragged */
  onMarkerDrag?: (markerId: string, lng: number, lat: number) => void;
  /** Route lines to display between waypoints */
  routeLines?: Array<{ coordinates: [number, number][]; color?: string; width?: number }>;
  /** Children to render on top of map */
  children?: React.ReactNode;
}

/**
 * OSM-based map style for MapLibre GL
 */
const OSM_MAP_STYLE = {
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
} as any;

function resolveStyleUrlWithKey(
  url: string | undefined,
  key: string | undefined
): string | undefined {
  if (!url) {
    return undefined;
  }

  const hasPlaceholder =
    url.includes('{MAPTILER_API_KEY}') || url.includes('{MAPTILER_KEY}');

  if (!hasPlaceholder) {
    return url;
  }

  if (!key) {
    return undefined;
  }

  return url.replace(/\{MAPTILER_API_KEY\}|\{MAPTILER_KEY\}/g, key);
}

function applyStyleToken(
  template: unknown,
  token: string,
  replacement: string
): unknown {
  if (Array.isArray(template)) {
    return template.map((item) => applyStyleToken(item, token, replacement));
  }

  if (template && typeof template === 'object') {
    return Object.entries(template as Record<string, unknown>).reduce(
      (acc, [entryKey, entryValue]) => {
        acc[entryKey] = applyStyleToken(entryValue, token, replacement);
        return acc;
      },
      {} as Record<string, unknown>
    );
  }

  if (typeof template === 'string') {
    return template.includes(token)
      ? template.split(token).join(replacement)
      : template;
  }

  return template;
}

const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_API_KEY;
const RAW_MAP_STYLE_URL = process.env.NEXT_PUBLIC_MAP_STYLE_URL;

const ENV_STYLE_URL = resolveStyleUrlWithKey(RAW_MAP_STYLE_URL, MAPTILER_KEY);

const CUSTOM_TRIPER_STYLE: StyleSpecification | null = MAPTILER_KEY
  ? (applyStyleToken(
      triperRadiantStyle,
      '{MAPTILER_KEY}',
      MAPTILER_KEY
    ) as StyleSpecification)
  : null;

// Precompute the map style so the map renders even without MapTiler configuration.
const RESOLVED_MAP_STYLE: string | StyleSpecification =
  ENV_STYLE_URL ?? CUSTOM_TRIPER_STYLE ?? (OSM_MAP_STYLE as StyleSpecification);

/**
 * MapView component with MapLibre GL + H3 support
 */
export function MapView({
  initialCenter = [-122.45, 37.78], // San Francisco
  initialZoom = 10,
  height = '100%',
  onClick,
  showControls = true,
  h3Cells = [],
  markers = [],
  onMarkerDrag,
  routeLines = [],
  children,
}: MapViewProps) {
  const mapRef = useRef<MapRef>(null);
  const [viewState, setViewState] = useState<Partial<ViewState>>({
    longitude: initialCenter[0],
    latitude: initialCenter[1],
    zoom: initialZoom,
  });
  
  const { encryptedAuras, setSelectedMatch, matches } = useMatchStore();

  const handleClick = useCallback((event: MapLayerMouseEvent) => {
    if (onClick) {
      const { lng, lat } = event.lngLat;
      onClick({ lng, lat, lngLat: [lng, lat] });
    }
  }, [onClick]);

  const handleMove = useCallback((evt: any) => {
    setViewState(evt.viewState);
  }, []);
  
  const handleAuraClick = useCallback((matchId: string) => {
    const match = matches.find(m => m.id === matchId);
    if (match) {
      setSelectedMatch(match);
    }
  }, [matches, setSelectedMatch]);

  /**
   * Convert H3 cells to GeoJSON polygons
   */
  // Convert H3 cells to GeoJSON for map rendering
  const h3CellsGeoJSON = React.useMemo(() => {
    if (h3Cells.length === 0) return null;
    
    return {
      type: 'FeatureCollection' as const,
      features: h3Cells.map((cell) => {
        const boundary = cellToBoundary(cell.h3Index, true); // [lat, lng] format
        const coordinates = [
          boundary.map(([lat, lng]) => [lng, lat]), // Convert to [lng, lat]
        ];
        
        return {
          type: 'Feature' as const,
          geometry: {
            type: 'Polygon' as const,
            coordinates,
          },
          properties: {
            h3Index: cell.h3Index,
            color: cell.color || '#3b82f6',
            opacity: cell.opacity || 0.3,
          },
        };
      }),
    };
  }, [h3Cells]);

  /**
   * Convert route lines to GeoJSON
   */
  const routeLinesGeoJSON = React.useMemo(() => {
    if (routeLines.length === 0) return null;
    
    return {
      type: 'FeatureCollection' as const,
      features: routeLines.map((route, index) => ({
        type: 'Feature' as const,
        geometry: {
          type: 'LineString' as const,
          coordinates: route.coordinates,
        },
        properties: {
          color: route.color || '#6b8e23',
          width: route.width || 4,
          id: `route-${index}`,
        },
      })),
    };
  }, [routeLines]);

  return (
    <div className="relative w-full" style={{ height }}>
      <Map
        ref={mapRef}
        {...viewState}
        onMove={handleMove}
        onClick={handleClick}
        mapStyle={RESOLVED_MAP_STYLE}
        attributionControl={false}
        reuseMaps
        style={{ width: '100%', height: '100%' }}
      >
        {showControls && (
          <>
            <NavigationControl position="top-right" />
            <GeolocateControl position="top-right" />
            <ScaleControl position="bottom-right" />
            <FullscreenControl position="top-right" />
          </>
        )}

        {/* H3 Cell Layers - Privacy-blurred areas */}
        {h3CellsGeoJSON && (
          <Source id="h3-cells" type="geojson" data={h3CellsGeoJSON}>
            <Layer
              id="h3-cell-fills"
              type="fill"
              paint={{
                'fill-color': ['get', 'color'],
                'fill-opacity': ['get', 'opacity'],
              }}
            />
            <Layer
              id="h3-cell-outlines"
              type="line"
              paint={{
                'line-color': ['get', 'color'],
                'line-width': 2,
                'line-opacity': 0.6,
              }}
            />
          </Source>
        )}

        {/* Route Lines - Connection between waypoints */}
        {routeLinesGeoJSON && (
          <Source id="route-lines" type="geojson" data={routeLinesGeoJSON}>
            <Layer
              id="route-line-casing"
              type="line"
              paint={{
                'line-color': '#ffffff',
                'line-width': ['get', 'width'],
                'line-opacity': 0.8,
              }}
              layout={{
                'line-cap': 'round',
                'line-join': 'round',
              }}
            />
            <Layer
              id="route-line-main"
              type="line"
              paint={{
                'line-color': ['get', 'color'],
                'line-width': ['-', ['get', 'width'], 2],
                'line-opacity': 1,
              }}
              layout={{
                'line-cap': 'round',
                'line-join': 'round',
              }}
            />
          </Source>
        )}
        
        {/* Regular markers */}
        {markers.map((marker, idx) => (
          <Marker
            key={marker.id || `marker-${idx}`}
            longitude={marker.lng}
            latitude={marker.lat}
            anchor="bottom"
            draggable={marker.draggable !== false} // Draggable by default
            onDragEnd={(e) => {
              if (onMarkerDrag && marker.id) {
                onMarkerDrag(marker.id, e.lngLat.lng, e.lngLat.lat);
              }
            }}
          >
            <div
              className="flex flex-col items-center cursor-grab active:cursor-grabbing"
              style={{ color: marker.color || '#ef4444' }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
              {marker.label && (
                <span className="text-xs font-medium mt-1 bg-white px-2 py-0.5 rounded shadow-lg">
                  {marker.label}
                </span>
              )}
            </div>
          </Marker>
        ))}
        
        {/* Encrypted auras (blurred user locations) */}
        {encryptedAuras.map((aura) => {
          const [lng, lat] = aura.position;
          return (
            <Marker
              key={aura.matchId}
              longitude={lng}
              latitude={lat}
              anchor="center"
            >
              <button
                onClick={() => handleAuraClick(aura.matchId)}
                className="relative group"
              >
                {/* Pulsing aura effect */}
                <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-30" />
                
                {/* Main circle */}
                <div 
                  className="relative w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full shadow-lg flex items-center justify-center transition-transform group-hover:scale-110"
                  style={{
                    opacity: Math.max(0.4, Math.min(0.9, aura.matchScore / 100)),
                  }}
                >
                  <span className="text-white font-bold text-sm">
                    {aura.matchScore}%
                  </span>
                </div>
                
                {/* Hover tooltip */}
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  ~{aura.approximateDistance}km away
                </div>
              </button>
            </Marker>
          );
        })}

        {children}
      </Map>
    </div>
  );
}

/**
 * Hook to access map instance and utilities
 */
export function useMapRef() {
  const mapRef = useRef<MapRef>(null);
  
  const getMap = useCallback(() => {
    return mapRef.current?.getMap();
  }, []);
  
  const flyTo = useCallback((lng: number, lat: number, zoom?: number) => {
    mapRef.current?.flyTo({
      center: [lng, lat],
      zoom: zoom ?? 12,
      duration: 2000,
    });
  }, []);
  
  const fitBounds = useCallback((
    bounds: [[number, number], [number, number]],
    padding?: number
  ) => {
    mapRef.current?.fitBounds(bounds, { padding: padding ?? 50 });
  }, []);
  
  return { mapRef, getMap, flyTo, fitBounds };
}
