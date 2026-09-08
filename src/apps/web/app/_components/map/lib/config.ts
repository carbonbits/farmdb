/**
 * Static settings the map boots with and the endpoints it talks to. The API
 * origin falls back to the current page origin, so the map works same origin in
 * local dev and can be pointed at another host with NEXT_PUBLIC_API_URL.
 */
import type { StyleSpecification } from "maplibre-gl";

export const BASE_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
    },
  },
  layers: [{ id: "osm", type: "raster", source: "osm" }],
};
export const FALLBACK_CENTER: [number, number] = [0, 0];

export const FALLBACK_ZOOM = 1;

export const FIT_PADDING = 60;

export const FIT_MAX_ZOOM = 17;

export const WORKER_URL = "/maplibre-gl-worker.mjs";

export function apiOrigin(): string {
  return process.env.NEXT_PUBLIC_API_URL || window.location.origin;
}

export const TILE_PATH = "/v1/tiles";
export function tileUrl(layerId: string): string {
  return `${apiOrigin()}${TILE_PATH}/${layerId}/{z}/{x}/{y}.mvt`;
}

export function tilePrefix(): string {
  return `${apiOrigin()}${TILE_PATH}/`;
}

export const FEATURES_PATH = "/v1/geo/features";
export function featuresUrl(): string {
  return `${apiOrigin()}${FEATURES_PATH}`;
}
