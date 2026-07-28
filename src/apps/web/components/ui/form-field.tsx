import type { InputHTMLAttributes } from "react";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
	label: string;
}

export function FormField({ label, id, ...inputProps }: FormFieldProps) {
	return (
		<div className="mb-3.5">
			<label
				htmlFor={id}
				className="mb-[5px] block text-xs font-semibold text-[#3F2D22]"
			>
				{label}
			</label>
			<input
				id={id}
				className="w-full rounded-[10px] border-[1.5px] border-[#EADFCB] bg-white px-3 py-2.5 text-[13.5px] text-[#20160F] outline-0 focus:border-[#346B41]"
				{...inputProps}
			/>
		</div>
	);
}
