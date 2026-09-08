import type { GeoApiConfig, GeoFeature, GeoFeatureCollection } from "@farmdb/geo/types";
import { GeoApiError } from "@farmdb/geo/utils/errors/geo_api";



/**
 * Reads farm features from the geo API.
 *
 * The app builds it with a config that says where the feature endpoints live,
 * so this class holds no path or version of its own and stays to one job:
 * sending requests and returning features.
 *
 * Each call takes a bearer token, because the token is refreshed while the app
 * runs and the freshest one is passed in every time.
 */
export class ApiClient {
  constructor(private readonly config: GeoApiConfig) {}

  async getFeature(accessToken: string, id: string): Promise<GeoFeature> {
    const response = await this.send(
      `${this.config.featuresUrl}/${encodeURIComponent(id)}`,
      accessToken,
    );
    return (await response.json()) as GeoFeature;
  }

  async listFeatures(
    accessToken: string,
    layer: string,
    season?: string,
  ): Promise<GeoFeatureCollection> {
    const query = new URLSearchParams({ layer });
    if (season) query.set("season", season);
    const response = await this.send(
      `${this.config.featuresUrl}/?${query.toString()}`,
      accessToken,
    );
    return (await response.json()) as GeoFeatureCollection;
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
