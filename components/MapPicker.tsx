"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";
import "leaflet-control-geocoder/dist/Control.Geocoder.css";

interface MapPickerProps {
  onLocationSelect: (lat: number, lng: number) => void;
  defaultLat?: number;
  defaultLng?: number;
}

function MapEventsAndSearch({
  onLocationSelect,
  position,
  setPosition
}: {
  onLocationSelect: (lat: number, lng: number) => void;
  position: any;
  setPosition: (p: any) => void;
}) {
  const { useMap } = require("react-leaflet");
  const map = useMap();
  const geocoderRef = useRef<any>(null);
  
  // FIX: Create a mutable ref to always hold the freshest version of the form updater
  const latestOnLocationSelect = useRef(onLocationSelect);

  // Update the ref whenever the parent form changes
  useEffect(() => {
    latestOnLocationSelect.current = onLocationSelect;
  }, [onLocationSelect]);

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      import("leaflet"),
      import("leaflet-control-geocoder")
    ]).then(([L]) => {
      if (!isMounted) return;

      // Prevent adding the search bar multiple times
      if (!geocoderRef.current) {
        geocoderRef.current = (L as any).Control.geocoder({
          defaultMarkGeocode: false,
          placeholder: "ابحث عن مدينة أو حي...",
          errorMessage: "لم يتم العثور على الموقع."
        })
          .on("markgeocode", function (e: any) {
            const latlng = e.geocode.center;
            map.setView(latlng, 14);
            setPosition(latlng);
            // Use the ref here to guarantee we don't overwrite the form with stale data
            latestOnLocationSelect.current(latlng.lat, latlng.lng);
          })
          .addTo(map);

        // Native DOM protection to stop Enter key from submitting parent form
        const container = geocoderRef.current.getContainer();
        if (container) {
          container.addEventListener("keydown", (e: KeyboardEvent) => {
            if (e.key === "Enter") e.preventDefault();
          });
        }
      }

      // Map click handler
      const clickHandler = (e: any) => {
        setPosition(e.latlng);
        latestOnLocationSelect.current(e.latlng.lat, e.latlng.lng);
      };

      map.on("click", clickHandler);

      return () => {
        isMounted = false;
        map.off("click", clickHandler);
        if (geocoderRef.current) {
          map.removeControl(geocoderRef.current);
          geocoderRef.current = null;
        }
      };
    });
  }, [map, setPosition]); // Removed onLocationSelect from dependencies to prevent infinite re-binding

  const { Marker } = require("react-leaflet");
  const [L] = [require("leaflet")];
  
  const markerIcon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41]
  });

  return position ? <Marker position={position} icon={markerIcon} /> : null;
}

function LeafletMapInner({
  onLocationSet
}: {
  onLocationSet: (lat: number, lng: number) => void;
}) {
  const [position, setPosition] = useState<any>(null);
  const { MapContainer, TileLayer } = require("react-leaflet");

  return (
    <div className="w-full h-72 rounded-lg overflow-hidden border border-neutral-200 relative z-0">
      <MapContainer
        center={[24.7136, 46.6753]}
        zoom={11}
        scrollWheelZoom={false}
        style={{ width: "100%", height: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapEventsAndSearch
          onLocationSelect={onLocationSet}
          position={position}
          setPosition={setPosition}
        />
      </MapContainer>
    </div>
  );
}

// Wrapper for SSR
const ClientMap = dynamic(() => Promise.resolve(LeafletMapInner), {
  ssr: false,
  loading: () => (
    <div className="w-full h-72 bg-neutral-100 flex items-center justify-center text-neutral-400">
      جاري تحميل الخريطة...
    </div>
  )
});

export default function MapPicker({ onLocationSelect }: MapPickerProps) {
  return (
    <div className="w-full">
      <ClientMap onLocationSet={onLocationSelect} />
    </div>
  );
}