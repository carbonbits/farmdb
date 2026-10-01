"use client";

import type { SelectHTMLAttributes } from "react";
import { forwardRef, useId } from "react";
import { controlClassName, FieldFrame } from "./field-frame";

export interface SelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "id"> {
  label: string;
  options: readonly string[];
  /** Shown first with an empty value, so nothing is picked until the user chooses. */
  placeholder?: string;
  error?: string;
  id?: string;
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(function SelectField(
  { label, options, placeholder, error, id, className, ...selectProps },
  ref,
) {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  return (
    <FieldFrame label={label} controlId={selectId} error={error}>
      <select
        ref={ref}
        id={selectId}
        aria-invalid={error ? true : undefined}
        className={controlClassName(Boolean(error), `bg-white ${className ?? ""}`.trim())}
        {...selectProps}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </FieldFrame>
  );
});
