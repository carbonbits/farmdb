"use client";

import { Settings, Sprout } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useEntitlements } from "@/lib/entitlements";
import { CollapseToggle } from "./collapse-toggle";
import { NAV_SECTIONS } from "./nav-config";
import { isNavItemActive } from "./nav-item";
import { NavSection } from "./nav-section";
import { useSidebarCollapsed } from "./use-sidebar-collapsed";

export function Sidebar() {
	const pathname = usePathname();
	const entitlements = useEntitlements();
	const { collapsed, toggle } = useSidebarCollapsed();
	const { user } = useAuth();

	const initials = (user?.display_name || user?.email || "?")
		.trim()
		.split(/\s+/)
		.map((part) => part[0])
		.slice(0, 2)
		.join("")
		.toUpperCase();

	return (
		<aside
			className={`flex h-screen flex-col justify-between bg-[#20160F] p-[18px_14px] text-[#EADFCB] ${
				collapsed ? "w-[72px]" : "w-[246px]"
			}`}
		>
			<div className="flex flex-col gap-6">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2.5">
						<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#346B41]">
							<Sprout size={18} className="text-[#F4EAD4]" aria-hidden="true" />
						</span>
						{!collapsed && (
							<div className="flex flex-col leading-tight">
								<span className="text-[18px] font-semibold text-[#F4EAD4]">
									Wakulima
								</span>
								<span className="text-xs text-[#877154]">Farm manager</span>
							</div>
						)}
					</div>
					{!collapsed && (
						<CollapseToggle collapsed={collapsed} onToggle={toggle} />
					)}
				</div>

				<nav className="flex flex-col gap-5">
					{NAV_SECTIONS.map((section) => (
						<NavSection
							key={section.label}
							section={section}
							entitlements={entitlements}
							pathname={pathname}
							collapsed={collapsed}
						/>
					))}
				</nav>
			</div>

			<div className="flex flex-col gap-3">
				{collapsed && (
					<div className="flex justify-center">
						<CollapseToggle collapsed={collapsed} onToggle={toggle} />
					</div>
				)}
				<div className="flex items-center justify-between gap-2 border-t border-white/10 pt-3">
					<div className="flex items-center gap-2.5 overflow-hidden">
						<span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#346B41] text-xs font-semibold text-[#F4EAD4]">
							{initials}
						</span>
						{!collapsed && (
							<div className="flex flex-col overflow-hidden leading-tight">
								<span className="truncate text-sm font-medium text-[#EADFCB]">
									{user?.display_name || user?.email}
								</span>
								<span className="truncate text-xs text-[#877154]">
									Owner · Mkulima Farm
								</span>
							</div>
						)}
					</div>
					{!collapsed && (
						<Link
							href="/settings"
							aria-label="Settings"
							aria-current={
								isNavItemActive(pathname, "/settings") ? "page" : undefined
							}
							className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
								isNavItemActive(pathname, "/settings")
									? "bg-[#346B41] text-[#F4EAD4]"
									: "text-[#C8BA9F] hover:bg-white/5 hover:text-[#EADFCB]"
							}`}
						>
							<Settings size={16} aria-hidden="true" />
						</Link>
					)}
				</div>
			</div>
		</aside>
	);
}
