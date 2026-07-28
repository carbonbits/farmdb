import type { ReactNode } from "react";

interface CardProps {
	warm?: boolean;
	children: ReactNode;
}

export function Card({ warm, children }: CardProps) {
	return (
		<div
			className={`rounded-2xl border border-[#EADFCB] p-5 ${warm ? "bg-[#FCF8F0]" : "bg-white"}`}
		>
			{children}
		</div>
	);
}

interface CardHeadProps {
	title: string;
	action?: ReactNode;
}

export function CardHead({ title, action }: CardHeadProps) {
	return (
		<div className="mb-3.5 flex items-center justify-between">
			<div className="text-base font-semibold text-[#20160F]">{title}</div>
			{action}
		</div>
	);
}
