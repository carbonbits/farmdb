import type { GeoFeature, GeoFeatureCollection } from "./types";

export class GeoApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "GeoApiError";
  }
}

export class GeoFeatureClient {
  constructor(private readonly baseUrl: string = "") {}

  async getFeature(accessToken: string, id: string): Promise<GeoFeature> {
    const response = await fetch(`${this.baseUrl}/v1/geo/features/${encodeURIComponent(id)}`, {
      method: "GET",
      headers: this.authHeaders(accessToken),
    });
    return this.parse<GeoFeature>(response);
  }

  async listFeatures(
    accessToken: string,
    layer: string,
    season?: string,
  ): Promise<GeoFeatureCollection> {
    const params = new URLSearchParams({ layer });
    if (season) params.set("season", season);
    const response = await fetch(`${this.baseUrl}/v1/geo/features/?${params.toString()}`, {
      method: "GET",
      headers: this.authHeaders(accessToken),
    });
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
