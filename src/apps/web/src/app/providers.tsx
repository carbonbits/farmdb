"use client";

import { AuthProvider, FarmdbDataConfig } from "@farmdb/api-client";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <FarmdbDataConfig>
      <AuthProvider>{children}</AuthProvider>
    </FarmdbDataConfig>
  );
}
