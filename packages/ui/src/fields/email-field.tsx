"use client";

import { forwardRef } from "react";
import type { TextFieldProps } from "./text-field";
import { TextField } from "./text-field";

export type EmailFieldProps = Omit<TextFieldProps, "type" | "label"> & { label?: string };

export const EmailField = forwardRef<HTMLInputElement, EmailFieldProps>(function EmailField(
  { label = "Email", placeholder = "you@farm.com", autoComplete = "email", ...props },
  ref,
) {
  return (
    <TextField
      ref={ref}
      type="email"
      label={label}
      placeholder={placeholder}
      autoComplete={autoComplete}
      {...props}
    />
  );
});
