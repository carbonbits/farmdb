import { API_BASE, authHeaders, handleResponse } from "@farmdb/api-client/api";

export interface FarmdbRequest {
  path: string;
  options?: RequestInit;
}

export type FarmdbKey = readonly [
  path: string,
  options: RequestInit | undefined,
  accessToken: string,
];

/**
 * The single fetcher for the FarmDB API. Adds the base URL and auth headers to
 * every request and turns error responses into AuthApiError.
 */
export async function farmdbFetcher<ResponseBody = unknown>([
  path,
  options,
  accessToken,
]: FarmdbKey): Promise<ResponseBody> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: authHeaders(accessToken),
  });
  return handleResponse<ResponseBody>(response);
}
