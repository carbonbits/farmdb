"use client";

import { useAuth } from "@farmdb/api-client";
import { FarmMap } from "@farmdb/map";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AppShell } from "../_components/app-shell";

export default function FieldsPage() {
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
    <AppShell active="fields" eyebrow="Farm" title="Fields" contentFill>
      <div className="relative min-h-0 flex-1">
        <FarmMap />
      </div>
    </AppShell>
  );
}
