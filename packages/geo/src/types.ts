/**
 * The shapes the map API speaks. Two families live here: the GeoJSON features
 * the API returns or accepts, and the OGC discovery documents (collections and
 * tilesets) a client walks to reach the data. Properties lists only the fields
 * the map reads, so add fields here as the map starts using them.
 */
import type { Feature, Geometry, GeometryCollection } from "geojson";

export type GeoGeometry = Exclude<Geometry, GeometryCollection>;

export interface GeoFeatureProperties {
  name?: string;
}

export type GeoFeature = Feature<GeoGeometry, GeoFeatureProperties> & {
  id: string;
  layer: string;
  season: string | null;
};

/**
 * The bodies for writing a feature. The collection travels in the URL and the
 * API forbids unknown fields, so these are exactly what may be sent: a geometry
 * and optional properties, plus a season only when creating in a seasonal
 * collection. A feature keeps its layer and season once created, so the update
 * body carries neither.
 */
export interface CreateFeatureInput {
  geometry: GeoGeometry;
  properties?: GeoFeatureProperties;
  season?: string;
}

export interface UpdateFeatureInput {
  geometry: GeoGeometry;
  properties?: GeoFeatureProperties;
}

/** A bounding box in the collection's CRS, ordered [minX, minY, maxX, maxY]. */
export type BBox = [minX: number, minY: number, maxX: number, maxY: number];

/**
 * One link in an OGC document. rel says what the target is to this document;
 * the client matches on it to walk from a collection to its tiles.
 */
export interface OgcLink {
  href: string;
  rel: string;
  type?: string;
  title?: string;
}

/**
 * A layer as the map API describes it. The map reads its geometry class to
 * style it, its extent to frame the opening view, and its links to find tiles.
 * The extent's spatial is null until the layer holds something.
 */
export interface Collection {
  id: string;
  title: string;
  geometryType: string;
  seasonal: boolean;
  extent: { spatial: { bbox: BBox[] } | null };
  links: OgcLink[];
}

/** The tilesets document: the tile URLs a collection offers, per matrix set. */
export interface TileSets {
  tilesets: Array<{ tileMatrixSetId: string; links: OgcLink[] }>;
  links: OgcLink[];
}

/** Where the map API lives. The app owns the base path; the client owns calls. */
export interface GeoApiConfig {
  mapsUrl: string;
}
