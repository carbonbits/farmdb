"use client";

import { AuthProvider } from "@farmdb/api-client";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
