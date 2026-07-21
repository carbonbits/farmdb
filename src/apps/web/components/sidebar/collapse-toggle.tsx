"use client";

import { ChevronsLeft, ChevronsRight } from "lucide-react";

interface CollapseToggleProps {
	collapsed: boolean;
	onToggle: () => void;
}

export function CollapseToggle({ collapsed, onToggle }: CollapseToggleProps) {
	return (
		<button
			type="button"
			onClick={onToggle}
			aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
			className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#C8BA9F] hover:bg-white/5 hover:text-[#EADFCB]"
		>
			{collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
		</button>
	);
}
