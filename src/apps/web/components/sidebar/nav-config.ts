import {
	BarChart3,
	Box,
	Calendar,
	LayoutGrid,
	Link2,
	type LucideIcon,
	Map as MapIcon,
	PawPrint,
	Sprout,
	Tag,
	Wallet,
} from "lucide-react";
import type { Entitlements } from "@/lib/entitlements";

export interface NavItem {
	label: string;
	href: string;
	icon: LucideIcon;
}

export interface NavSection {
	label: string;
	items: NavItem[];
	requires?: keyof Entitlements;
}

export const NAV_SECTIONS: NavSection[] = [
	{
		label: "Overview",
		items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutGrid }],
	},
	{
		label: "Production",
		items: [
			{ label: "Fields & mapping", href: "/fields", icon: MapIcon },
			{ label: "Crops & fields", href: "/crops", icon: Sprout },
			{ label: "Livestock", href: "/livestock", icon: PawPrint },
		],
	},
	{
		label: "Operations",
		items: [
			{ label: "Tasks & calendar", href: "/tasks", icon: Calendar },
			{ label: "Inventory", href: "/inventory", icon: Box },
		],
	},
	{
		label: "Money",
		items: [
			{ label: "Finances", href: "/finances", icon: Wallet },
			{ label: "Reports", href: "/reports", icon: BarChart3 },
		],
	},
	{
		label: "Organization",
		requires: "organization",
		items: [{ label: "Farm connects", href: "/connects", icon: Link2 }],
	},
	{
		label: "Platform admin",
		requires: "platformAdmin",
		items: [{ label: "Connect pricing", href: "/admin/pricing", icon: Tag }],
	},
];
