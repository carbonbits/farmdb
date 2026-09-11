import type { Collection, GeoApiConfig, GeoFeature, TileSets } from "@farmdb/geo/types";
import { GeoApiError } from "@farmdb/geo/utils/errors/geo_api";
import { MVT_MEDIA_TYPE, TILE_ITEM_REL, TILESETS_VECTOR_REL } from "./ogc";

/**
 * Reads farm layers and features from the OGC map API. This is the one place
 * that speaks OGC in the app, so the app passes in where the API lives and a
 * fresh bearer token on every call. To find the tiles for a layer the client
 * follows the links the API returns instead of building a URL, and when a
 * layer offers no tiles it returns null so the map skips it.
 */
export class ApiClient {
  constructor(private readonly config: GeoApiConfig) {}

  async listCollections(accessToken: string): Promise<Collection[]> {
    const response = await this.send(`${this.config.mapsUrl}/collections`, accessToken);
    const document = (await response.json()) as { collections: Collection[] };
    return document.collections;
  }

  async getFeature(
    accessToken: string,
    collectionId: string,
    featureId: string,
  ): Promise<GeoFeature> {
    const url = `${this.config.mapsUrl}/collections/${encodeURIComponent(collectionId)}/items/${encodeURIComponent(featureId)}`;
    const response = await this.send(url, accessToken);
    return (await response.json()) as GeoFeature;
  }

  async tileTemplate(accessToken: string, collection: Collection): Promise<string | null> {
    const tilesetsLink = collection.links.find((link) => link.rel === TILESETS_VECTOR_REL);
    if (!tilesetsLink) return null;

    const response = await this.send(tilesetsLink.href, accessToken);
    const document = (await response.json()) as TileSets;
    const matrixSet = document.tilesets[0];
    if (!matrixSet) return null;

    const tile = matrixSet.links.find(
      (link) => link.rel === TILE_ITEM_REL && link.type === MVT_MEDIA_TYPE,
    );
    return tile?.href ?? null;
  }

  private async send(url: string, accessToken: string): Promise<Response> {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      throw new GeoApiError(`Geo request failed with ${response.status}`, response.status);
    }
    return response;
  }
}