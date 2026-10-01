"use client";

import type { InputHTMLAttributes, ReactNode } from "react";
import { forwardRef, useId } from "react";
import { controlClassName, FieldFrame } from "./field-frame";

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

  const extraClasses = [endAdornment ? "pr-10" : "", className ?? ""].join(" ");

  return (
    <FieldFrame label={label} controlId={inputId} error={error}>
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          className={controlClassName(Boolean(error), extraClasses.trim())}
          {...inputProps}
        />
        {endAdornment && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-2.5">{endAdornment}</div>
        )}
      </div>
    </FieldFrame>
  );
});
