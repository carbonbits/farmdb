/**
 * Static settings the map boots with and where it reaches the API. The API
 * origin falls back to the current page origin so the map works same origin in
 * local dev and can point at another host with NEXT_PUBLIC_API_URL. The maps
 * path is the one entry point the client needs, and the maps prefix is the
 * boundary that decides which requests carry the access token.
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
