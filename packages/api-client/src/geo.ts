import { API_BASE, authHeaders, handleResponse } from "./api";
import type { GeoFeature, GeoFeatureCollection } from "./types";

export const geoApi = {
  async getFeature(accessToken: string, id: string): Promise<GeoFeature> {
    const response = await fetch(`${API_BASE}/v1/geo/features/${id}`, {
      method: "GET",
      headers: authHeaders(accessToken),
    });
    return handleResponse<GeoFeature>(response);
  },
  async listFeatures(
    accessToken: string,
    layer: string,
    season?: string,
  ): Promise<GeoFeatureCollection> {
    const params = new URLSearchParams({ layer });
    if (season) params.set("season", season);
    const response = await fetch(`${API_BASE}/v1/geo/features/?${params.toString()}`, {
      method: "GET",
      headers: authHeaders(accessToken),
    });
    return handleResponse<GeoFeatureCollection>(response);
  },
};
