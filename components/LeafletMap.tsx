"use client";

import { useEffect, useRef, useState } from "react";
import * as L from "leaflet";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import Geocoder, { geocoder } from "leaflet-control-geocoder";

import "leaflet/dist/leaflet.css";
import "leaflet-control-geocoder/dist/Control.Geocoder.css";

// This module is only ever loaded on the client (see MapPicker's dynamic import),
// so Leaflet can be imported statically instead of required at render time.

// The package does not re-export its event type from the entry point.
type MarkGeocodeEvent = Parameters<Geocoder["markGeocode"]>[0];

const RIYADH_CENTER: L.LatLngTuple = [24.7136, 46.6753];

const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function MapEventsAndSearch({
  onLocationSelect,
  position,
  setPosition,
}: {
  onLocationSelect: (lat: number, lng: number) => void;
  position: L.LatLng | null;
  setPosition: (p: L.LatLng) => void;
}) {
  const map = useMap();

  // Always hold the freshest version of the form updater so the map handlers,
  // which are bound once, never write through a stale closure.
  const latestOnLocationSelect = useRef(onLocationSelect);
  useEffect(() => {
    latestOnLocationSelect.current = onLocationSelect;
  }, [onLocationSelect]);

  useEffect(() => {
    const control: Geocoder = geocoder({
      defaultMarkGeocode: false,
      placeholder: "ابحث عن مدينة أو حي...",
      errorMessage: "لم يتم العثور على الموقع.",
    });

    const handleGeocode = (e: MarkGeocodeEvent) => {
      const latlng = e.geocode.center;
      map.setView(latlng, 14);
      setPosition(latlng);
      latestOnLocationSelect.current(latlng.lat, latlng.lng);
    };

    control.on("markgeocode", handleGeocode).addTo(map);

    // Native DOM protection to stop the Enter key from submitting the parent form
    const container = control.getContainer();
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === "Enter") e.preventDefault();
    };
    container?.addEventListener("keydown", handleKeydown);

    const handleClick = (e: L.LeafletMouseEvent) => {
      setPosition(e.latlng);
      latestOnLocationSelect.current(e.latlng.lat, e.latlng.lng);
    };
    map.on("click", handleClick);

    return () => {
      map.off("click", handleClick);
      container?.removeEventListener("keydown", handleKeydown);
      map.removeControl(control);
    };
  }, [map, setPosition]);

  return position ? <Marker position={position} icon={markerIcon} /> : null;
}

export default function LeafletMap({
  onLocationSet,
}: {
  onLocationSet: (lat: number, lng: number) => void;
}) {
  const [position, setPosition] = useState<L.LatLng | null>(null);

  return (
    <div className="w-full h-72 rounded-lg overflow-hidden border border-neutral-200 relative z-0">
      <MapContainer
        center={RIYADH_CENTER}
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
