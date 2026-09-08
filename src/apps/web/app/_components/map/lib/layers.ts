/**
 * The map's own idea of a layer, with no dependency on any map library. A layer
 * has an id, a label for the toggle, the kind of geometry it holds, whether it
 * varies by season, and the permission a user needs to view it.
 */
export type GeometryClass = "polygon" | "line" | "point";

export interface MapLayer {
  id: string;
  label: string;
  geometry: GeometryClass;
  seasonal: boolean;
  view: string;
}
