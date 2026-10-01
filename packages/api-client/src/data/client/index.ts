import type { paths } from "@farmdb/api-client/generated/api";
import createClient, { type Middleware } from "openapi-fetch";

/** Empty means the API is served from the same origin as the web app. */
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
const API_PATH_PREFIX = "/v1/";
const REQUEST_TIMEOUT_MS = 30_000;

type FarmdbPath = Extract<keyof paths, `/v1/${string}`>;
export type FarmdbPaths = Pick<paths, FarmdbPath>;

export function apiOrigin(): string {
  return API_BASE ? new URL(API_BASE).origin : window.location.origin;
}

function isFarmdbApiUrl(url: URL): boolean {
  return url.origin === apiOrigin() && url.pathname.startsWith(API_PATH_PREFIX);
}

/** Keeps the token on FarmDB's own API and gives every request a time limit. */
const farmdbRequestRules: Middleware = {
  onRequest({ request }) {
    if (!isFarmdbApiUrl(new URL(request.url))) {
      throw new Error("Refused a request outside the FarmDB API.");
    }
    return new Request(request, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  },
};

export function bearerHeader(accessToken: string | null): Record<string, string> {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
}

export const farmdbApi = createClient<FarmdbPaths>({ baseUrl: API_BASE });
farmdbApi.use(farmdbRequestRules);
