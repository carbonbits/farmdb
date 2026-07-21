"use client";

import type { Entitlements } from "@/lib/entitlements";
import type { NavSection as NavSectionConfig } from "./nav-config";
import { NavItem } from "./nav-item";

interface NavSectionProps {
	section: NavSectionConfig;
	entitlements: Entitlements;
	pathname: string;
	collapsed: boolean;
}

export function NavSection({
	section,
	entitlements,
	pathname,
	collapsed,
}: NavSectionProps) {
	if (section.requires && !entitlements[section.requires]) {
		return null;
	}

	return (
		<div className="flex flex-col gap-1">
			{!collapsed && (
				<div className="px-2.5 text-[10px] font-bold tracking-[1.3px] text-[#877154] uppercase">
					{section.label}
				</div>
			)}
			{section.items.map((item) => (
				<NavItem
					key={item.href}
					item={item}
					pathname={pathname}
					collapsed={collapsed}
				/>
			))}
		</div>
	);
}
