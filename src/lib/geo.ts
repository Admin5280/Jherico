"use client";

export interface Coords {
  lat: number | null;
  lng: number | null;
}

/** Best-effort browser geolocation; resolves nulls if unavailable/denied. */
export function getPosition(): Promise<Coords> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return resolve({ lat: null, lng: null });
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve({ lat: null, lng: null }),
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 60000 },
    );
  });
}
