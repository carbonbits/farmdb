"use client";

import { useAuth } from "@farmdb/api-client";
import { AppShell } from "./_components/app-shell";
import { SignInScreen } from "./_components/sign-in-screen";

export default function Home() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f2e5] text-[#957a5c]">
        Loading…
      </div>
    );
  }

  if (!isAuthenticated) {
    return <SignInScreen />;
  }

  return (
    <AppShell active="dashboard" eyebrow="Overview" title="Dashboard">
      <div className="mx-auto max-w-[1320px]">
        <div className="rounded-[10px] border border-[#eadfcb] bg-white p-6">
          <div className="font-serif text-[17px] font-semibold">
            Welcome back{user?.display_name ? `, ${user.display_name}` : ""}
          </div>
          <p className="mt-1.5 text-[13px] text-[#75583f]">
            Signed in as {user?.email}. Fields, crops, tasks and finances land here next — for now,
            head to <span className="font-semibold text-[#346b41]">Settings → Access control</span>{" "}
            to manage roles and permissions.
          </p>
        </div>

        {/* Placeholder module tiles */}
        <div className="mt-[18px] grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-[18px]">
          {["Fields", "Crops", "Tasks", "Finances"].map((m) => (
            <div
              key={m}
              className="rounded-[10px] border border-dashed border-[#d8c9a9] bg-[#fcf8f0] p-[18px] text-[#957a5c]"
            >
              <div className="text-[13.5px] font-semibold text-[#3f2d22]">{m}</div>
              <div className="mt-1 text-[12.5px]">Coming soon</div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
