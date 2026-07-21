"use client";

import Link from "next/link";
import type { NavItem as NavItemConfig } from "./nav-config";

export function isNavItemActive(pathname: string, href: string): boolean {
	return pathname === href || pathname.startsWith(`${href}/`);
}

interface NavItemProps {
	item: NavItemConfig;
	pathname: string;
	collapsed: boolean;
}

export function NavItem({ item, pathname, collapsed }: NavItemProps) {
	const Icon = item.icon;
	const active = isNavItemActive(pathname, item.href);

	return (
		<Link
			href={item.href}
			title={collapsed ? item.label : undefined}
			className={`flex items-center gap-2.5 rounded-[9px] px-2.5 py-2.5 text-[13.5px] font-medium transition-colors ${
				active
					? "bg-[#346B41] text-[#F4EAD4]"
					: "text-[#C8BA9F] hover:bg-white/5 hover:text-[#EADFCB]"
			}`}
		>
			<Icon size={18} className="shrink-0" aria-hidden="true" />
			{!collapsed && <span>{item.label}</span>}
		</Link>
	);
}
