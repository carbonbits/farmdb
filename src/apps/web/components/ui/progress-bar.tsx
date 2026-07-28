interface ProgressBarProps {
	percent: number;
}

export function ProgressBar({ percent }: ProgressBarProps) {
	return (
		<div className="my-3 h-[7px] overflow-hidden rounded-md bg-[#F4EAD4]">
			<div
				className="h-full rounded-md bg-[#346B41]"
				style={{ width: `${Math.max(0, Math.min(100, percent))}%` }}
			/>
		</div>
	);
}
