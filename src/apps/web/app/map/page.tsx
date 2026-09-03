"use client";

import { useAuth } from "@farmdb/api-client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AppShell } from "../_components/app-shell";
import { FarmMap } from "../_components/map";

export default function MapPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/login");
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f2e5] text-[#957a5c]">
        Loading…
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f2e5] text-[#957a5c]">
        Redirecting…
      </div>
    );
  }

  return (
    <AppShell active="map" eyebrow="Farm" title="Map" contentFill>
      <div className="relative min-h-0 flex-1">
        <FarmMap />
      </div>
    </AppShell>
  );
}