/**
 * The fixed strings the map client uses to talk to the OGC map API. The rel
 * values and media types come from the OGC standard and from HTTP, not from us,
 * so they live in one place with plain names and the client reads them by name
 * instead of carrying raw strings in its logic.
 */
export const TILESETS_VECTOR_REL = "http://www.opengis.net/def/rel/ogc/1.0/tilesets-vector";
export const TILE_ITEM_REL = "item";
export const MVT_MEDIA_TYPE = "application/vnd.mapbox-vector-tile";
export const JSON_MEDIA_TYPE = "application/json";
