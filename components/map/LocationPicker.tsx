'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Loader2, AlertCircle } from 'lucide-react';
import type * as LeafletType from 'leaflet';

interface LocationPickerProps {
  initialLat?: number;
  initialLng?: number;
  onLocationChange: (location: {
    latitude: number;
    longitude: number;
    address?: string;
  }) => void;
}

const DEFAULT_DHAKA_LAT = 23.8103;
const DEFAULT_DHAKA_LNG = 90.4125;

export function LocationPicker({
  initialLat = DEFAULT_DHAKA_LAT,
  initialLng = DEFAULT_DHAKA_LNG,
  onLocationChange,
}: LocationPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletType.Map | null>(null);
  const markerRef = useRef<LeafletType.Marker | null>(null);

  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: initialLat,
    lng: initialLng,
  });
  const [isLocating, setIsLocating] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [reverseAddress, setReverseAddress] = useState<string>('');
  const [geoError, setGeoError] = useState<string | null>(null);

  // Perform reverse geocoding via OpenStreetMap Nominatim
  const reverseGeocode = async (lat: number, lng: number) => {
    setIsGeocoding(true);
    setGeoError(null);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'en',
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        const address = data.display_name || '';
        setReverseAddress(address);
        onLocationChange({ latitude: lat, longitude: lng, address });
      } else {
        onLocationChange({ latitude: lat, longitude: lng });
      }
    } catch {
      onLocationChange({ latitude: lat, longitude: lng });
    } finally {
      setIsGeocoding(false);
    }
  };

  // Initialize Leaflet Map
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (typeof window === 'undefined' || !mapContainerRef.current) return;

      const L = (await import('leaflet')).default;

      if (!isMounted || !mapContainerRef.current) return;

      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: [coords.lat, coords.lng],
          zoom: 15,
          zoomControl: true,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map);

        // Custom styled brand pin icon
        const customPin = L.divIcon({
          className: 'custom-map-pin',
          html: `
            <div style="
              width: 32px;
              height: 32px;
              background-color: #0F172A;
              border: 3px solid #D97706;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <div style="
                width: 8px;
                height: 8px;
                background-color: #D97706;
                border-radius: 50%;
                transform: rotate(45deg);
              "></div>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 32],
        });

        const marker = L.marker([coords.lat, coords.lng], {
          draggable: true,
          icon: customPin,
        }).addTo(map);

        // Update coordinates when marker is dragged
        marker.on('dragend', (e) => {
          const newPos = e.target.getLatLng();
          setCoords({ lat: newPos.lat, lng: newPos.lng });
          reverseGeocode(newPos.lat, newPos.lng);
        });

        // Click on map moves the marker
        map.on('click', (e) => {
          marker.setLatLng(e.latlng);
          setCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
          reverseGeocode(e.latlng.lat, e.latlng.lng);
        });

        mapInstanceRef.current = map;
        markerRef.current = marker;
      }
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // HTML5 "Use My Current Location"
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ lat: latitude, lng: longitude });

        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.setView([latitude, longitude], 16);
          markerRef.current.setLatLng([latitude, longitude]);
        }

        reverseGeocode(latitude, longitude);
        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        setGeoError(
          err.code === 1
            ? 'Location permission was denied. Please select your location on the map.'
            : 'Unable to retrieve location. Please pin your address manually.'
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <MapPin className="w-4 h-4 text-brand-gold-600 shrink-0" />
          <span className="text-xs font-bold text-slate-900">Pin Delivery Location</span>
          {isGeocoding && (
            <span className="text-[11px] text-brand-gold-600 flex items-center gap-1 font-medium">
              <Loader2 className="w-3 h-3 animate-spin" />
              Fetching address...
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={isLocating}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-brand-navy hover:text-white text-slate-700 text-xs font-semibold transition-colors disabled:opacity-50 shrink-0"
        >
          {isLocating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Navigation className="w-3.5 h-3.5 text-brand-gold-600" />
          )}
          <span>{isLocating ? 'Detecting Location...' : 'Use My Current Location'}</span>
        </button>
      </div>

      {geoError && (
        <div className="flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-lg">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{geoError}</span>
        </div>
      )}

      {/* Map Container */}
      <div className="relative h-64 sm:h-72 w-full rounded-xl border border-slate-300 overflow-hidden shadow-inner bg-slate-100">
        <div ref={mapContainerRef} className="w-full h-full" />
      </div>

      {/* Selected Coordinates & Detected Address readout */}
      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
        <div className="flex justify-between items-center text-[11px] text-slate-500">
          <span>Coordinates: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</span>
          <span className="text-emerald-600 font-semibold">Drag pin or click map to adjust</span>
        </div>
        {reverseAddress && (
          <p className="text-slate-700 text-xs leading-relaxed font-medium">
            <span className="text-slate-400 font-normal">Detected: </span>
            {reverseAddress}
          </p>
        )}
      </div>
    </div>
  );
}