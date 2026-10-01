"use client";

import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "ghost";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const BASE_CLASSES =
  "inline-flex items-center justify-center gap-1.5 rounded-[10px] px-3 py-[7px] text-[12.5px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-55";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-fern text-white hover:bg-forest",
  ghost: "border border-parchment bg-white text-soil hover:bg-cream",
};

/** The app's button: primary for the main action on a screen, ghost for the rest. */
export function Button({
  variant = "ghost",
  type = "button",
  className,
  ...buttonProps
}: ButtonProps) {
  const classes = [BASE_CLASSES, VARIANT_CLASSES[variant], className ?? ""]
    .filter(Boolean)
    .join(" ");
  return <button type={type} className={classes} {...buttonProps} />;
}
