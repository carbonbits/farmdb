import type { Feature, FeatureCollection, Geometry, GeometryCollection } from "geojson";

export type GeoGeometry = Exclude<Geometry, GeometryCollection>;
export type GeoJsonGeometry = GeoGeometry;

export interface GeoFeatureProperties {
  name?: string;
  [key: string]: unknown;
}

export type GeoFeature = Feature<GeoGeometry, GeoFeatureProperties> & {
  layer: string;
  season: string | null;
};

export interface GeoFeatureCollection extends FeatureCollection<GeoGeometry, GeoFeatureProperties> {
  features: GeoFeature[];
}
