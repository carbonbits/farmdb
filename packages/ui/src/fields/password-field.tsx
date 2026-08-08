"use client";

import { forwardRef, useState } from "react";
import type { TextFieldProps } from "./text-field";
import { TextField } from "./text-field";

export type PasswordFieldProps = Omit<TextFieldProps, "type" | "endAdornment" | "label"> & {
  label?: string;
};

function EyeIcon() {
  return (
    <svg
      className="h-[18px] w-[18px]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      className="h-[18px] w-[18px]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 3l18 18" />
      <path d="M10.6 5.1A10.9 10.9 0 0112 5c6.5 0 10 7 10 7a17.4 17.4 0 01-3.2 4.1M6.6 6.6C4 8.3 2 12 2 12s3.5 7 10 7a10 10 0 004.4-1" />
      <path d="M9.5 9.6a3 3 0 004 4" />
    </svg>
  );
}

export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  function PasswordField(
    { label = "Password", placeholder = "••••••••••", autoComplete = "current-password", ...props },
    ref,
  ) {
    const [visible, setVisible] = useState(false);

    return (
      <TextField
        ref={ref}
        type={visible ? "text" : "password"}
        label={label}
        placeholder={placeholder}
        autoComplete={autoComplete}
        endAdornment={
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="text-[#957a5c] hover:text-[#3f2d22]"
            aria-label={visible ? "Hide password" : "Show password"}
            tabIndex={-1}
          >
            {visible ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        }
        {...props}
      />
    );
  },
);
