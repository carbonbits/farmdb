/**
 * The map's own idea of a layer, with no dependency on any map library, and how
 * to build one from an API collection. A layer has an id, a label for the
 * toggle, the kind of geometry it holds and whether it varies by season. The
 * geometry map turns the API geometry name into the class the map draws, and an
 * unknown name yields no layer so it is skipped rather than drawn wrong.
 */
import type { Collection } from "@farmdb/geo";

export type GeometryClass = "polygon" | "line" | "point";

const GEOMETRY_CLASS: Record<string, GeometryClass> = {
  POLYGON: "polygon",
  LINESTRING: "line",
  POINT: "point",
};

export interface MapLayer {
  id: string;
  label: string;
  geometry: GeometryClass;
  seasonal: boolean;
}

export function toMapLayer(collection: Collection): MapLayer | null {
  const geometry = GEOMETRY_CLASS[collection.geometryType];
  if (!geometry) return null;
  return {
    id: collection.id,
    label: collection.title,
    geometry,
    seasonal: collection.seasonal,
  };
}
