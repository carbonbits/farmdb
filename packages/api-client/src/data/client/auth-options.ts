"use client";

import { useAuth } from "@farmdb/api-client/context";
import { bearerHeader } from "@farmdb/api-client/data/client";

export type AuthOptions = {
  headers: Record<string, string>;
};

/** Request options carrying the signed-in user's token, or null when signed out. */
export function useAuthOptions(): AuthOptions | null {
  const { accessToken } = useAuth();
  return accessToken ? { headers: bearerHeader(accessToken) } : null;
}
