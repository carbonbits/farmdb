"use client";

import type { InputHTMLAttributes, ReactNode } from "react";
import { forwardRef, useId } from "react";

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id"> {
  label: string;
  error?: string;
  id?: string;
  endAdornment?: ReactNode;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, error, id, className, endAdornment, ...inputProps },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-[12.5px] font-semibold text-[#3f2d22]">
        {label}
      </label>
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          className={[
            "w-full rounded-md border px-3 py-2.5 text-[14.5px] text-[#20160f] outline-none placeholder:text-[#bda98a] focus:ring-2",
            error
              ? "border-[#eccfbe] focus:border-[#b46038] focus:ring-[#b46038]/15"
              : "border-[#eadfcb] focus:border-[#346b41] focus:ring-[#346b41]/15",
            endAdornment ? "pr-10" : "",
            className ?? "",
          ]
            .filter(Boolean)
            .join(" ")}
          {...inputProps}
        />
        {endAdornment && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-2.5">{endAdornment}</div>
        )}
      </div>
      {error && <span className="text-[12px] text-[#8a3f1e]">{error}</span>}
    </div>
  );
});
