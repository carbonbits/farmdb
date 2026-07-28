"use client";

interface SegmentedControlOption<T extends string> {
	value: T;
	label: string;
}

interface SegmentedControlProps<T extends string> {
	options: readonly SegmentedControlOption<T>[];
	value: T;
	onChange: (value: T) => void;
	"aria-label": string;
}

export function SegmentedControl<T extends string>({
	options,
	value,
	onChange,
	"aria-label": ariaLabel,
}: SegmentedControlProps<T>) {
	return (
		<div
			role="tablist"
			aria-label={ariaLabel}
			className="inline-flex shrink-0 gap-0 rounded-[10px] bg-[#F4EAD4] p-[3px]"
		>
			{options.map((option) => (
				<button
					key={option.value}
					type="button"
					role="tab"
					aria-selected={option.value === value}
					onClick={() => onChange(option.value)}
					className={`rounded-lg border-0 px-3.5 py-1.5 text-[12.5px] font-semibold ${
						option.value === value
							? "bg-white text-[#20160F] shadow-[0_1px_2px_rgba(0,0,0,0.1)]"
							: "bg-transparent text-[#75583F]"
					}`}
				>
					{option.label}
				</button>
			))}
		</div>
	);
}
