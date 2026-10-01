import { bearerHeader, farmdbApi } from "@farmdb/api-client/data/client";
import { unwrap } from "@farmdb/api-client/data/client/errors";
import type {
  Collection,
  CreateFeatureInput,
  GeoApiConfig,
  GeoFeature,
  GeoGeometry,
  ImportFeatureInput,
  ImportResult,
  UpdateFeatureInput,
} from "@farmdb/geo/types";
import { MVT_MEDIA_TYPE, TILE_ITEM_REL, TILESETS_VECTOR_REL } from "./ogc";

/**
 * Talks to the OGC map API: it reads the layers and features the map shows and
 * writes the features a user draws. This is the one place that speaks OGC in
 * the app. Every call goes through the shared FarmDB client, so the map API
 * gets the same origin check, time limit and safe errors as the rest of the
 * app. When a layer offers no tiles it returns null so the map skips it.
 */
export class ApiClient {
  constructor(private readonly config: GeoApiConfig) {}

  async listCollections(accessToken: string): Promise<Collection[]> {
    const document = await unwrap(
      farmdbApi.GET("/v1/maps/collections", { headers: bearerHeader(accessToken) }),
    );
    return asCollections(document.collections);
  }

  async getFeature(
    accessToken: string,
    collectionId: string,
    featureId: string,
  ): Promise<GeoFeature> {
    const feature = await unwrap(
      farmdbApi.GET("/v1/maps/collections/{collection_id}/items/{feature_id}", {
        params: { path: { collection_id: collectionId, feature_id: featureId } },
        headers: bearerHeader(accessToken),
      }),
    );
    return asGeoFeature(feature);
  }

  async createFeature(
    accessToken: string,
    collectionId: string,
    input: CreateFeatureInput,
  ): Promise<GeoFeature> {
    const feature = await unwrap(
      farmdbApi.POST("/v1/maps/collections/{collection_id}/items", {
        params: { path: { collection_id: collectionId } },
        headers: bearerHeader(accessToken),
        body: { ...input, geometry: plainGeometry(input.geometry) },
      }),
    );
    return asGeoFeature(feature);
  }

  async updateFeature(
    accessToken: string,
    collectionId: string,
    featureId: string,
    input: UpdateFeatureInput,
  ): Promise<GeoFeature> {
    const feature = await unwrap(
      farmdbApi.PUT("/v1/maps/collections/{collection_id}/items/{feature_id}", {
        params: { path: { collection_id: collectionId, feature_id: featureId } },
        headers: bearerHeader(accessToken),
        body: { ...input, geometry: plainGeometry(input.geometry) },
      }),
    );
    return asGeoFeature(feature);
  }

  async deleteFeature(accessToken: string, collectionId: string, featureId: string): Promise<void> {
    await unwrap(
      farmdbApi.DELETE("/v1/maps/collections/{collection_id}/items/{feature_id}", {
        params: { path: { collection_id: collectionId, feature_id: featureId } },
        headers: bearerHeader(accessToken),
      }),
    );
  }

  /**
   * Sends a collection of features to a layer and returns how many landed and
   * which were skipped. The geometries go as they came from the file and the
   * api checks each one. A season is carried only when one is given.
   */
  async importFeatures(
    accessToken: string,
    collectionId: string,
    features: ImportFeatureInput[],
    season?: string,
  ): Promise<ImportResult> {
    return unwrap(
      farmdbApi.POST("/v1/maps/collections/{collection_id}/import", {
        params: { path: { collection_id: collectionId }, query: { season } },
        headers: bearerHeader(accessToken),
        body: { features },
      }),
    );
  }

  async tileTemplate(accessToken: string, collection: Collection): Promise<string | null> {
    const offersVectorTiles = collection.links.some((link) => link.rel === TILESETS_VECTOR_REL);
    if (!offersVectorTiles) return null;

    const document = await unwrap(
      farmdbApi.GET("/v1/maps/collections/{collection_id}/tiles", {
        params: { path: { collection_id: collection.id } },
        headers: bearerHeader(accessToken),
      }),
    );
    const matrixSet = document.tilesets[0];
    if (!matrixSet) return null;

    const tile = matrixSet.links.find(
      (link) => link.rel === TILE_ITEM_REL && link.type === MVT_MEDIA_TYPE,
    );
    return tile ? this.ownApiUrl(tile.href) : null;
  }

  /**
   * Keeps only the path of a link the API returned and puts this client's own
   * API address in front, so the bearer token never follows a link to another
   * host. A link outside the maps API is refused. Plain string handling keeps
   * the {z}/{x}/{y} tile placeholders intact.
   */
  private ownApiUrl(href: string): string | null {
    const linkPath = href.replace(/^[a-z][a-z0-9+.-]*:\/\/[^/]+/i, "");
    const mapsPath = new URL(this.config.mapsUrl).pathname;
    if (!linkPath.startsWith(`${mapsPath}/`)) return null;

    const apiOrigin = this.config.mapsUrl.slice(0, -mapsPath.length);
    return apiOrigin + linkPath;
  }
}

/**
 * The API's schema types geometry loosely, so these are the one place geo reads
 * a response as its own GeoJSON types. The API validates every shape it stores.
 * Remove them once the backend types its geometry.
 */
function asGeoFeature(feature: unknown): GeoFeature {
  return feature as GeoFeature;
}

function asCollections(collections: unknown): Collection[] {
  return collections as Collection[];
}

/**
 * GeoJSON declares its geometries as interfaces, which TypeScript won't pass
 * where the API accepts an object with any keys. A plain copy holds the same
 * data and passes.
 */
function plainGeometry(geometry: GeoGeometry) {
  return { ...geometry };
}
