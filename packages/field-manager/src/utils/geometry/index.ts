/** A polygon as rings of [longitude, latitude] points: the outer edge, then any holes. */
export type PolygonRings = number[][][];

/** The rings of a polygon geometry, or null when the geometry is anything else. */
export function polygonRings(geometry: unknown): PolygonRings | null {
  const isPolygon =
    typeof geometry === "object" &&
    geometry !== null &&
    "type" in geometry &&
    geometry.type === "Polygon" &&
    "coordinates" in geometry &&
    Array.isArray(geometry.coordinates);
  return isPolygon ? (geometry.coordinates as PolygonRings) : null;
}
