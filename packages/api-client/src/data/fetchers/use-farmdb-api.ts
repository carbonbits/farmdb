"use client";

import type { AuthApiError } from "@farmdb/api-client/api";
import { useAuth } from "@farmdb/api-client/context";
import {
  type FarmdbKey,
  type FarmdbRequest,
  farmdbFetcher,
} from "@farmdb/api-client/data/fetchers/fetcher";
import useSWR, { type SWRResponse } from "swr";

/**
 * Reads data from the FarmDB API with caching. Sends no request until the user
 * is signed in.
 */
export function useFarmdbApi<ResponseBody = unknown>(
  request: FarmdbRequest | null,
): SWRResponse<ResponseBody, AuthApiError> {
  const { accessToken } = useAuth();
  const isReadyToFetch = request !== null && accessToken !== null;
  const cacheKey: FarmdbKey | null = isReadyToFetch
    ? [request.path, request.options, accessToken]
    : null;

  return useSWR<ResponseBody, AuthApiError>(cacheKey, farmdbFetcher<ResponseBody>);
}
