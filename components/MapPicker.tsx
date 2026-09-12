"use client";

import dynamic from "next/dynamic";

interface MapPickerProps {
  onLocationSelect: (lat: number, lng: number) => void;
  defaultLat?: number;
  defaultLng?: number;
}

// Leaflet touches `window` at import time, so the map module must never be
// evaluated during SSR/prerender.
const ClientMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-72 bg-neutral-100 flex items-center justify-center text-neutral-400">
      جاري تحميل الخريطة...
    </div>
  ),
});

export default function MapPicker({ onLocationSelect }: MapPickerProps) {
  return (
    <div className="w-full">
      <ClientMap onLocationSet={onLocationSelect} />
    </div>
  );
}
