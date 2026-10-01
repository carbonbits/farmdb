import type { ReactNode } from "react";

/** The border, focus ring and text every form control shares. */
export function controlClassName(hasError: boolean, extraClasses = ""): string {
  return [
    "w-full rounded-md border px-3 py-2.5 text-[14.5px] text-[#20160f] outline-none placeholder:text-[#bda98a] focus:ring-2",
    hasError
      ? "border-[#eccfbe] focus:border-[#b46038] focus:ring-[#b46038]/15"
      : "border-[#eadfcb] focus:border-[#346b41] focus:ring-[#346b41]/15",
    extraClasses,
  ]
    .filter(Boolean)
    .join(" ");
}

/** A form control with its label above and its error below. */
export function FieldFrame({
  label,
  controlId,
  error,
  children,
}: {
  label: string;
  controlId: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={controlId} className="text-[12.5px] font-semibold text-[#3f2d22]">
        {label}
      </label>
      {children}
      {error && <span className="text-[12px] text-[#8a3f1e]">{error}</span>}
    </div>
  );
}
