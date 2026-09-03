import type { GeoFeature } from "@farmdb/api-client";

type BBox = [west: number, south: number, east: number, north: number];

function walk(coords: unknown, box: [number, number, number, number]): boolean {
  if (
    Array.isArray(coords) &&
    coords.length >= 2 &&
    typeof coords[0] === "number" &&
    typeof coords[1] === "number"
  ) {
    const lng = coords[0] as number;
    const lat = coords[1] as number;
    if (lng < box[0]) box[0] = lng;
    if (lat < box[1]) box[1] = lat;
    if (lng > box[2]) box[2] = lng;
    if (lat > box[3]) box[3] = lat;
    return true;
  }
  if (Array.isArray(coords)) {
    let hit = false;
    for (const c of coords) {
      if (walk(c, box)) hit = true;
    }
    return hit;
  }
  return false;
}

export function featuresToBbox(features: GeoFeature[]): BBox | null {
  const box: [number, number, number, number] = [Infinity, Infinity, -Infinity, -Infinity];
  let hit = false;
  for (const f of features) {
    if (walk(f.geometry.coordinates, box)) hit = true;
  }
  return hit ? box : null;
}
