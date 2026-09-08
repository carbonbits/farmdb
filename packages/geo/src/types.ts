/**
 * The shapes the geo API returns. A GeoFeature is a standard GeoJSON Feature
 * with three extra fields the backend adds: an id that is always present, the
 * layer the shape belongs to, and the season it applies to (null when the layer
 * is not seasonal). Properties lists only the fields the map actually reads, so
 * add new fields here as the map starts using them.
 */
import type { Feature, FeatureCollection, Geometry, GeometryCollection } from "geojson";

export type GeoGeometry = Exclude<Geometry, GeometryCollection>;

export interface GeoFeatureProperties {
  name?: string;
}

export type GeoFeature = Feature<GeoGeometry, GeoFeatureProperties> & {
  id: string;
  layer: string;
  season: string | null;
};

export interface GeoFeatureCollection extends FeatureCollection<GeoGeometry, GeoFeatureProperties> {
  features: GeoFeature[];
}

export interface GeoApiConfig {
  featuresUrl: string;
}
