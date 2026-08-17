"use client";

import { useAuth } from "@farmdb/api-client";
import { useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";

/** Sidebar destinations from the Wakulima design. Only Settings is wired this pass. */
const NAV: Array<{ key: string; label: string; d: string; href?: string }> = [
  {
    key: "dashboard",
    label: "Dashboard",
    d: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
    href: "/",
  },
  { key: "fields", label: "Fields", d: "M3 17l6-11 6 11M2 20h20" },
  {
    key: "crops",
    label: "Crops",
    d: "M12 20v-8M12 12c-1-4-4-6-8-5 1 4 4 6 8 5zM12 11c1-3.5 4-5 8-4.5-1 3.5-4 5-8 4.5z",
  },
  { key: "tasks", label: "Tasks", d: "M4 6h16M4 12h16M4 18h10" },
  { key: "inventory", label: "Inventory", d: "M3 7l9-4 9 4v10l-9 4-9-4z" },
  { key: "finances", label: "Finances", d: "M3 7h18v12H3zM3 11h18" },
  { key: "audit", label: "Audit log", d: "M12 8v4l3 2M12 21a9 9 0 100-18 9 9 0 000 18z" },
  {
    key: "settings",
    label: "Settings",
    href: "/settings",
    d: "M12 15.2a3.2 3.2 0 100-6.4 3.2 3.2 0 000 6.4M19.6 15.4l1.2 1a1.6 1.6 0 01-1.5 2.6l-1.5-.3-1.3 1.1-.5 1.5a1.6 1.6 0 01-3 0l-.5-1.5-1.3-1.1-1.5.3A1.6 1.6 0 013.2 16.4l1.2-1V13l-1.2-1a1.6 1.6 0 011.5-2.6l1.5.3 1.3-1.1.5-1.5a1.6 1.6 0 013 0l.5 1.5 1.3 1.1 1.5-.3a1.6 1.6 0 011.5 2.6l-1.2 1z",
  },
];

function initials(name: string | null, email: string): string {
  const base = (name || email).trim();
  const parts = base.split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return base.slice(0, 2).toUpperCase();
}

function NavIcon({ d }: { d: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px] flex-none"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

function NavList({ active, onNavigate }: { active: string; onNavigate: (href?: string) => void }) {
  return (
    <>
      <div className="px-2 pt-4 pb-1.5 text-[10px] font-bold uppercase tracking-[1.3px] text-[#877154]">
        Overview
      </div>
      {NAV.map((n) => {
        const isActive = n.key === active;
        const clickable = Boolean(n.href);
        return (
          <button
            key={n.key}
            type="button"
            onClick={() => onNavigate(n.href)}
            className={`flex items-center gap-[11px] rounded-[9px] px-2.5 py-[9px] text-left text-[13.5px] font-medium transition-colors ${
              isActive
                ? "bg-[#2c5a38] text-[#f4ead4]"
                : "text-[#c8ba9f] hover:bg-white/5 hover:text-[#eadfcb]"
            } ${clickable || isActive ? "cursor-pointer" : "cursor-default"}`}
          >
            <NavIcon d={n.d} />
            <span>{n.label}</span>
          </button>
        );
      })}
    </>
  );
}

export interface AppShellProps {
  /** nav key to highlight, e.g. "settings" */
  active?: string;
  eyebrow?: string;
  title?: string;
  /** optional content on the right of the top bar (chips, actions) */
  topRight?: ReactNode;
  children: ReactNode;
}

export function AppShell({
  active = "dashboard",
  eyebrow,
  title,
  topRight,
  children,
}: AppShellProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const go = (href?: string) => {
    setMenuOpen(false);
    if (href) router.push(href);
  };

  const displayName = user?.display_name || user?.email || "Signed in";
  const avatar = user ? initials(user.display_name, user.email) : "··";

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f2e5] text-[#20160f]">
      {/* Desktop sidebar */}
      <aside className="hidden w-[246px] flex-none flex-col gap-0.5 overflow-y-auto bg-[#20160f] px-3.5 py-[18px] text-[#eadfcb] md:flex">
        <div className="flex items-center gap-[11px] px-1.5 pt-1 pb-3.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-gradient-to-br from-[#4a8a54] to-[#2c5a38] font-serif font-bold text-[#f4ead4]">
            W
          </div>
          <div>
            <div className="font-serif text-[18px] font-semibold leading-[1.1] text-[#f4ead4]">
              Wakulima
            </div>
            <div className="mt-px text-[11px] text-[#9c8a6f]">Community edition</div>
          </div>
        </div>
        <NavList active={active} onNavigate={go} />
        <div className="mt-auto flex items-center gap-[11px] border-t border-white/10 px-2 pt-3.5 pb-1">
          <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-[#5b6f4a] text-[13px] font-bold text-[#f4ead4]">
            {avatar}
          </div>
          <div className="min-w-0">
            <div className="truncate text-[13px] font-semibold text-[#f4ead4]">{displayName}</div>
            <div className="text-[11px] text-[#9c8a6f]">Signed in</div>
          </div>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex h-screen min-w-0 flex-1 flex-col">
        <header className="flex flex-none flex-wrap items-center gap-3 border-b border-[#eadfcb] bg-[#f8f2e5]/90 px-4 py-3 backdrop-blur md:px-7">
          <button
            type="button"
            aria-label="Menu"
            onClick={() => setMenuOpen(true)}
            className="flex h-10 w-10 flex-none items-center justify-center rounded-[10px] border border-[#eadfcb] bg-white text-[#3f2d22] hover:bg-[#f4ead4] md:hidden"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-[19px] w-[19px]"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
          <div>
            {eyebrow ? (
              <div className="text-[10px] font-bold uppercase tracking-[1.4px] text-[#957a5c]">
                {eyebrow}
              </div>
            ) : null}
            {title ? (
              <div className="text-[21px] font-semibold leading-[1.1] tracking-[-.2px]">
                {title}
              </div>
            ) : null}
          </div>
          {topRight ? <div className="ml-auto flex items-center gap-2.5">{topRight}</div> : null}
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-7">{children}</div>
      </div>

      {/* Mobile menu drawer */}
      {menuOpen ? (
        <div className="md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
            className="fixed inset-0 z-50 bg-[#140e09]/45"
          />
          <div className="fixed inset-y-0 left-0 z-[55] flex w-[274px] max-w-[86vw] flex-col overflow-y-auto bg-[#20160f] px-3.5 py-4 text-[#eadfcb] shadow-2xl">
            <div className="flex items-center gap-[11px] px-1.5 pt-0.5 pb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-gradient-to-br from-[#4a8a54] to-[#2c5a38] font-serif font-bold text-[#f4ead4]">
                W
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-serif text-[17px] font-semibold leading-[1.1] text-[#f4ead4]">
                  Wakulima
                </div>
                <div className="text-[11px] text-[#9c8a6f]">Community edition</div>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setMenuOpen(false)}
                className="flex h-8 w-8 flex-none items-center justify-center rounded-lg border border-white/15 bg-white/5 text-[#c8ba9f]"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-[15px] w-[15px]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
            <NavList active={active} onNavigate={go} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
