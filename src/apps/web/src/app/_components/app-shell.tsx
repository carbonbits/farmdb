"use client";
import { useAuth } from "@farmdb/api-client";
import { useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";

const NAV: Array<{ key: string; label: string; d: string; href?: string }> = [
  {
    key: "dashboard",
    label: "Dashboard",
    d: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
    href: "/",
  },
  { key: "fields", label: "Fields", href: "/fields", d: "M3 17l6-11 6 11M2 20h20" },
  {
    key: "crops",
    label: "Crops",
    d: "M12 20v-8M12 12c-1-4-4-6-8-5 1 4 4 6 8 5zM12 11c1-3.5 4-5 8-4.5-1 3.5-4 5-8 4.5z",
  },
  { key: "tasks", label: "Tasks", d: "M4 6h16M4 12h16M4 18h10" },
  { key: "inventory", label: "Inventory", d: "M3 7l9-4 9 4v10l-9 4-9-4z" },
  { key: "finances", label: "Finances", d: "M3 7h18v12H3zM3 11h18" },
  {
    key: "audit",
    label: "Audit log",
    d: "M12 8v4l3 2M12 21a9 9 0 100-18 9 9 0 000 18z",
  },
  {
    key: "settings",
    label: "Settings",
    href: "/settings",
    d: "M12 15.2a3.2 3.2 0 100-6.4 3.2 3.2 0 000 6.4M19.6 15.4l1.2 1a1.6 1.6 0 01-1.5 2.6l-1.5-.3-1.3 1.1-.5 1.5a1.6 1.6 0 01-3 0l-.5-1.5-1.3-1.1-1.5.3A1.6 1.6 0 013.2 16.4l1.2-1V13l-1.2-1a1.6 1.6 0 011.5-2.6l1.5.3 1.3-1.1.5-1.5a1.6 1.6 0 013 0l.5 1.5 1.3 1.1 1.5-.3a1.6 1.6 0 011.5 2.6l-1.2 1z",
  },
];

/** Shared sidebar surface. Desktop and mobile add only their width and position. */
const SIDEBAR_SURFACE =
  "flex-col gap-0.5 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden bg-bark px-3.5 py-4 text-parchment";

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
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

/** The brand mark and name, shared by the desktop sidebar and the mobile drawer. */
function Brand() {
  return (
    <div className="flex min-w-0 items-center gap-[11px]">
      <div className="flex h-8 w-8 flex-none items-center justify-center rounded-[9px] bg-gradient-to-br from-leaf to-forest font-serif font-bold text-cream">
        W
      </div>
      <div className="min-w-0">
        <div className="truncate font-serif text-[18px] font-semibold leading-[1.1] text-cream">
          Wakulima
        </div>
        <div className="text-[11px] text-stone">Community edition</div>
      </div>
    </div>
  );
}

function NavList({ active, onNavigate }: { active: string; onNavigate: (href?: string) => void }) {
  const base =
    "flex items-center gap-[11px] rounded-[9px] px-2.5 py-[9px] text-left text-[13.5px] font-medium transition-colors";
  return (
    <>
      <div className="px-2 pt-4 pb-1.5 text-[10px] font-bold uppercase tracking-[1.3px] text-clay">
        Overview
      </div>
      {NAV.map((item) => {
        const isActive = item.key === active;
        const navigable = Boolean(item.href);
        let state: string;
        if (isActive) {
          state = "bg-forest text-cream";
        } else if (navigable) {
          state = "cursor-pointer text-sand hover:bg-white/5 hover:text-parchment";
        } else {
          state = "cursor-not-allowed text-stone";
        }
        return (
          <button
            key={item.key}
            type="button"
            disabled={!navigable && !isActive}
            aria-current={isActive ? "page" : undefined}
            onClick={() => onNavigate(item.href)}
            className={`${base} ${state}`}
          >
            <NavIcon d={item.d} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </>
  );
}

export interface AppShellProps {
  active?: string;
  eyebrow?: string;
  title?: string;
  topRight?: ReactNode;
  /** Let the content area fill the viewport instead of scrolling with padding.
   *  Used by pages that own their whole surface, like the map. */
  contentFill?: boolean;
  children: ReactNode;
}

export function AppShell({
  active = "dashboard",
  eyebrow,
  title,
  topRight,
  contentFill = false,
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
  const avatar = user ? initials(user.display_name ?? null, user.email) : "··";
  const contentClass = contentFill
    ? "flex min-h-0 flex-1 flex-col"
    : "flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-7";
  return (
    <div className="flex h-screen overflow-hidden bg-linen text-bark">
      {/* Desktop sidebar */}
      <aside className={`hidden w-[246px] flex-none md:flex ${SIDEBAR_SURFACE}`}>
        <div className="px-1.5 pt-1 pb-3.5">
          <Brand />
        </div>
        <NavList active={active} onNavigate={go} />
        <div className="mt-auto flex items-center gap-[11px] border-t border-white/10 px-2 pt-3.5 pb-1">
          <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-gradient-to-br from-leaf to-forest text-[13px] font-bold text-cream">
            {avatar}
          </div>
          <div className="min-w-0">
            <div className="truncate text-[13px] font-semibold text-cream">{displayName}</div>
            <div className="text-[11px] text-stone">Signed in</div>
          </div>
        </div>
      </aside>
      {/* Main column */}
      <div className="flex h-screen min-w-0 flex-1 flex-col">
        <header className="flex flex-none flex-wrap items-center gap-3 border-b border-parchment bg-linen/90 px-4 py-3 backdrop-blur md:px-7">
          <button
            type="button"
            aria-label="Menu"
            onClick={() => setMenuOpen(true)}
            className="flex h-10 w-10 flex-none items-center justify-center rounded-[10px] border border-parchment bg-white text-soil hover:bg-cream md:hidden"
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
              <div className="text-[10px] font-bold uppercase tracking-[1.4px] text-taupe">
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
        <div className={contentClass}>{children}</div>
      </div>
      {/* Mobile menu drawer */}
      {menuOpen ? (
        <div className="md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
            className="fixed inset-0 z-50 bg-scrim/45"
          />
          <div
            className={`fixed inset-y-0 left-0 z-[55] flex w-[274px] max-w-[86vw] shadow-2xl ${SIDEBAR_SURFACE}`}
          >
            <div className="flex items-center px-1.5 pt-0.5 pb-3">
              <div className="min-w-0 flex-1">
                <Brand />
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setMenuOpen(false)}
                className="flex h-8 w-8 flex-none items-center justify-center rounded-lg border border-white/15 bg-white/5 text-sand"
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
