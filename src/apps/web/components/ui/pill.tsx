import type { ReactNode } from "react";

const TONE_CLASSES = {
	ok: "bg-[#E7F0E2] text-[#2C5A38]",
	watch: "bg-[#F6ECD4] text-[#8A6316]",
	neutral: "bg-[#EFE7D6] text-[#7A634A]",
	high: "bg-[#F5E2D6] text-[#9C4A24]",
} as const;

interface PillProps {
	tone: keyof typeof TONE_CLASSES;
	children: ReactNode;
}

export function Pill({ tone, children }: PillProps) {
	return (
		<span
			className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${TONE_CLASSES[tone]}`}
		>
			{children}
		</span>
	);
}
