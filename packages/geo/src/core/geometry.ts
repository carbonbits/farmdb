import { bbox } from "@turf/bbox";
import type { GeoFeature } from "@farmdb/geo/types";

type BBox = [west: number, south: number, east: number, north: number];

/**
 * Computes the bounding box that contains every given feature.
 *
 * The map uses this to frame the opening view so all of the farm's data
 * is visible when the page loads. Returns null when there are no features,
 * which lets the caller fall back to a default viewport instead of trying
 * to fit an empty extent.
 */
export function featuresToBbox(features: GeoFeature[]): BBox | null {
  if (features.length === 0) return null;
  const collection = { type: "FeatureCollection" as const, features };
  const [west, south, east, north] = bbox(collection);
  return [west, south, east, north];
}
