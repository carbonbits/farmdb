"use client";

import { type AuthOptions, useAuthOptions } from "@farmdb/api-client/data/client/auth-options";
import { type ApiError, type ApiResult, unwrap } from "@farmdb/api-client/data/client/errors";
import useSWR, { type SWRResponse } from "swr";

/**
 * Reads from the FarmDB API with caching. Waits until the user is signed in, and
 * keys the cache by the user's token so one person's data never shows for another.
 */
export function useFarmdbApi<ResponseBody>(
  cacheName: string | null,
  load: (authOptions: AuthOptions) => Promise<ApiResult<ResponseBody>>,
): SWRResponse<ResponseBody, ApiError> {
  const authOptions = useAuthOptions();
  const isReadyToLoad = cacheName !== null && authOptions !== null;
  const cacheKey = isReadyToLoad ? ([cacheName, authOptions] as const) : null;

  return useSWR(cacheKey, ([_cacheName, signedInOptions]) => unwrap(load(signedInOptions)));
}
