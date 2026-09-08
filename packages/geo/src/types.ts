/**
 * The shapes the geo API returns, mirrored on the frontend. A GeoFeature is a
 * standard GeoJSON Feature with three extra fields the backend adds: an id that
 * is always present, the layer the shape belongs to, and the season it applies
 * to (null when the layer is not seasonal). Each feature also carries a
 * properties object whose keys are not fixed, because the backend stores them
 * as plain JSON. The map only reads name from it directly.
 */
import type { Feature, FeatureCollection, Geometry, GeometryCollection } from "geojson";

export type GeoGeometry = Exclude<Geometry, GeometryCollection>;

export interface GeoFeatureProperties {
  name?: string;
  [key: string]: unknown;
}

export type GeoFeature = Feature<GeoGeometry, GeoFeatureProperties> & {
  id: string;
  layer: string;
  season: string | null;
};

export interface GeoFeatureCollection extends FeatureCollection<GeoGeometry, GeoFeatureProperties> {
  features: GeoFeature[];
}