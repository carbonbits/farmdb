"use client";

import { ApiError } from "@farmdb/api-client/data/client/errors";
import type { ReactNode } from "react";
import { SWRConfig } from "swr";

/**
 * Client errors (4xx) are not retried: asking again will not fix a missing
 * sign-in, a missing permission or bad input. Server and network errors keep
 * SWR's normal retry, since those often clear on their own.
 */
function shouldRetryOnError(error: unknown): boolean {
  const isClientError = error instanceof ApiError && error.status >= 400 && error.status < 500;
  return !isClientError;
}

/** App-wide rules for reading data from the FarmDB API. */
export function FarmdbDataConfig({ children }: { children: ReactNode }) {
  return <SWRConfig value={{ shouldRetryOnError }}>{children}</SWRConfig>;
}
