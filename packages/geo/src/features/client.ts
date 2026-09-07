import type { GeoFeature, GeoFeatureCollection } from "@farmdb/geo/types";
import { GeoApiError } from "@farmdb/geo/utils/errors/geo_api";

/**
 * HTTP client for the geo feature API.
 *
 * Wraps the /v1/geo/features endpoints. Pass the API origin as baseUrl
 * so the same class works in same-origin deployments (empty string) and
 * cross-origin setups (full URL).
 * Every request needs a valid Bearer token.
 */
export class ApiClient {
  constructor(private readonly baseUrl: string = "") {}

  async getFeature(accessToken: string, id: string): Promise<GeoFeature> {
    const response = await fetch(
      `${this.baseUrl}/v1/geo/features/${encodeURIComponent(id)}`,
      {
        method: "GET",
        headers: this.authHeaders(accessToken),
      },
    );
    return this.parse<GeoFeature>(response);
  }

  async listFeatures(
    accessToken: string,
    layer: string,
    season?: string,
  ): Promise<GeoFeatureCollection> {
    const params = new URLSearchParams({ layer });
    if (season) params.set("season", season);
    const response = await fetch(
      `${this.baseUrl}/v1/geo/features/?${params.toString()}`,
      {
        method: "GET",
        headers: this.authHeaders(accessToken),
      },
    );
    return this.parse<GeoFeatureCollection>(response);
  }

  private authHeaders(accessToken: string): HeadersInit {
    return { Authorization: `Bearer ${accessToken}` };
  }

  private async parse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      throw new GeoApiError(`Geo request failed with ${response.status}`, response.status);
    }
    return (await response.json()) as T;
  }
}

export default ApiClient;
