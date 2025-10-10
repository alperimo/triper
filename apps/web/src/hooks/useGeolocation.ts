import { useCallback, useState } from 'react';

interface GeolocationPosition {
  lat: number;
  lng: number;
  accuracy?: number;
}

export function useGeolocation() {
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const getCurrentPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setError(new Error('Geolocation is not supported by your browser'));
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setLoading(false);
      },
      (err) => {
        setError(new Error(err.message));
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  const watchPosition = useCallback((callback: (pos: GeolocationPosition) => void) => {
    if (!navigator.geolocation) {
      setError(new Error('Geolocation is not supported by your browser'));
      return null;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const position = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        };
        setPosition(position);
        callback(position);
      },
      (err) => {
        setError(new Error(err.message));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    return watchId;
  }, []);

  const stopWatching = useCallback((watchId: number) => {
    navigator.geolocation.clearWatch(watchId);
  }, []);

  return {
    position,
    loading,
    error,
    getCurrentPosition,
    watchPosition,
    stopWatching,
  };
}
