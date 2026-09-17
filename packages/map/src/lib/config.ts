/**
 * Where the map reaches the api and where maplibre loads its worker. The maps
 * prefix is what decides which requests carry the access token.
 */

export const FALLBACK_CENTER: [number, number] = [0, 0];

export const FALLBACK_ZOOM = 1;

export const FIT_PADDING = 60;

export const FIT_MAX_ZOOM = 17;

export const WORKER_URL = "/maplibre-gl-worker.mjs";

const MAPS_PATH = "/v1/maps";

export function apiOrigin(): string {
  return process.env.NEXT_PUBLIC_API_URL || window.location.origin;
}

export function mapsUrl(): string {
  return `${apiOrigin()}${MAPS_PATH}`;
}

export function mapsPrefix(): string {
  return `${apiOrigin()}${MAPS_PATH}/`;
}