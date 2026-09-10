import type {
  Collection,
  CreateFeatureInput,
  GeoApiConfig,
  GeoFeature,
  TileSets,
  UpdateFeatureInput,
} from "@farmdb/geo/types";
import { GeoApiError } from "@farmdb/geo/utils/errors/geo_api";
import { JSON_MEDIA_TYPE, MVT_MEDIA_TYPE, TILE_ITEM_REL, TILESETS_VECTOR_REL } from "./ogc";

/**
 * Talks to the OGC map API: it reads the layers and features the map shows and
 * writes the features a user draws. This is the one place that speaks OGC in
 * the app, so the app passes in where the API lives and a fresh bearer token on
 * every call. To find the tiles for a layer the client follows the links the
 * API returns instead of building a URL, and when a layer offers no tiles it
 * returns null so the map skips it.
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
    const response = await this.send(this.itemUrl(collectionId, featureId), accessToken);
    return (await response.json()) as GeoFeature;
  }

  async createFeature(
    accessToken: string,
    collectionId: string,
    input: CreateFeatureInput,
  ): Promise<GeoFeature> {
    const response = await this.send(this.itemsUrl(collectionId), accessToken, {
      method: "POST",
      headers: { "Content-Type": JSON_MEDIA_TYPE },
      body: JSON.stringify(input),
    });
    return (await response.json()) as GeoFeature;
  }

  async updateFeature(
    accessToken: string,
    collectionId: string,
    featureId: string,
    input: UpdateFeatureInput,
  ): Promise<GeoFeature> {
    const response = await this.send(this.itemUrl(collectionId, featureId), accessToken, {
      method: "PUT",
      headers: { "Content-Type": JSON_MEDIA_TYPE },
      body: JSON.stringify(input),
    });
    return (await response.json()) as GeoFeature;
  }

  async deleteFeature(accessToken: string, collectionId: string, featureId: string): Promise<void> {
    await this.send(this.itemUrl(collectionId, featureId), accessToken, { method: "DELETE" });
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

  private itemsUrl(collectionId: string): string {
    return `${this.config.mapsUrl}/collections/${encodeURIComponent(collectionId)}/items`;
  }

  private itemUrl(collectionId: string, featureId: string): string {
    return `${this.itemsUrl(collectionId)}/${encodeURIComponent(featureId)}`;
  }

  private async send(url: string, accessToken: string, init?: RequestInit): Promise<Response> {
    const response = await fetch(url, {
      ...init,
      headers: { ...init?.headers, Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      throw new GeoApiError(`Geo request failed with ${response.status}`, response.status);
    }
    return response;
  }
}
