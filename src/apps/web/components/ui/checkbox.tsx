"use client";

interface CheckboxProps {
	checked: boolean;
	onChange: (checked: boolean) => void;
	label: string;
}

export function Checkbox({ checked, onChange, label }: CheckboxProps) {
	return (
		<button
			type="button"
			aria-pressed={checked}
			aria-label={`Mark "${label}" as ${checked ? "not done" : "done"}`}
			onClick={() => onChange(!checked)}
			className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
				checked
					? "border-[#346B41] bg-[#346B41] text-white"
					: "border-[#B49A78] text-transparent"
			}`}
		>
			<svg
				className="h-3 w-3"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth={3}
				aria-hidden="true"
			>
				<path d="M4 12l5 5L20 6" />
			</svg>
		</button>
	);
}
