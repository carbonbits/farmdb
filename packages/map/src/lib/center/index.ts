import type { Collection } from "@farmdb/geo";
import * as maplibregl from "maplibre-gl";

export const FALLBACK_CENTER: [number, number] = [0, 0];

export const FALLBACK_ZOOM = 1;

const FIT_PADDING = 60;

const FIT_MAX_ZOOM = 17;

/**
 * Moves the map so every shape in the given collections is in view. Does
 * nothing when none of them have an extent.
 */
export function fitToExtents(map: maplibregl.Map, collections: Collection[]): void {
  const bounds = new maplibregl.LngLatBounds();
  let hasExtent = false;

  for (const collection of collections) {
    const spatial = collection.extent.spatial;
    if (!spatial) continue;
    const box = spatial.bbox[0];
    if (!box) continue;
    bounds.extend([box[0], box[1]]);
    bounds.extend([box[2], box[3]]);
    hasExtent = true;
  }

  if (!hasExtent) return;

  map.fitBounds(bounds, { padding: FIT_PADDING, maxZoom: FIT_MAX_ZOOM, duration: 0 });
}