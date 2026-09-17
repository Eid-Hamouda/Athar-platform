/**
 * Locations on this platform are free text. The map pickers prepend a marker
 * ("إحداثيات:" / "إحداثيات الخريطة:") to a `lat, lng` pair, but donors and
 * beneficiaries may also type a place name by hand, so every helper here
 * returns `null` rather than guessing when it cannot find a real coordinate.
 */

export interface Coordinates {
  lat: number;
  lng: number;
}

/** Matches a bare `33.5138, 36.2765` pair anywhere in the string. */
const COORDINATE_PAIR = /(-?\d{1,3}(?:\.\d+)?)\s*[,،]\s*(-?\d{1,3}(?:\.\d+)?)/;

export function parseCoordinates(value?: string | null): Coordinates | null {
  if (!value) return null;

  const match = COORDINATE_PAIR.exec(value);
  if (!match) return null;

  const lat = Number(match[1]);
  const lng = Number(match[2]);

  // A typed address like "شارع 30, بناء 45" also matches the pair shape, so
  // anything outside real geographic bounds is treated as not-a-coordinate.
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;

  return { lat, lng };
}

const EARTH_RADIUS_KM = 6371;

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

/** Great-circle distance in kilometres. */
export function haversineKm(a: Coordinates, b: Coordinates): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(a.lat)) *
      Math.cos(toRadians(b.lat)) *
      Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Distance between two location strings, or `null` if either lacks coordinates. */
export function distanceBetween(
  from?: string | null,
  to?: string | null
): number | null {
  const a = parseCoordinates(from);
  const b = parseCoordinates(to);
  if (!a || !b) return null;
  return haversineKm(a, b);
}

/** Arabic, reader-facing distance label. */
export function formatDistanceAr(km: number): string {
  if (km < 1) return "أقل من كيلومتر واحد";
  if (km < 10) return `${km.toFixed(1)} كم`;
  return `${Math.round(km)} كم`;
}
