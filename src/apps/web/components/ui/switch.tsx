"use client";

interface SwitchProps {
	checked: boolean;
	onChange: (checked: boolean) => void;
	"aria-label": string;
}

export function Switch({
	checked,
	onChange,
	"aria-label": ariaLabel,
}: SwitchProps) {
	return (
		<button
			type="button"
			role="switch"
			aria-checked={checked}
			aria-label={ariaLabel}
			onClick={() => onChange(!checked)}
			className={`relative h-6 w-[42px] shrink-0 rounded-full border-0 p-0 transition-colors duration-150 ${
				checked ? "bg-[#346B41]" : "bg-[#B49A78]"
			}`}
		>
			<span
				className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.3)] transition-transform duration-150 ${
					checked ? "translate-x-[18px]" : "translate-x-0"
				}`}
			/>
		</button>
	);
}
