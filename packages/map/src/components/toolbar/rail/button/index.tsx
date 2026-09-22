import type { ReactNode } from "react";

/**
 * One icon button in the rail. Its label is the accessible name and the
 * tooltip. It looks active while its flyout is open, and greys out when it
 * cannot be used.
 */
export function RailButton({
  icon,
  label,
  active = false,
  disabled = false,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={[
        "flex h-10 w-10 items-center justify-center rounded-[9px] text-[17px] transition-colors",
        disabled
          ? "cursor-not-allowed text-sand"
          : active
            ? "bg-forest text-white"
            : "text-soil hover:bg-cream",
      ].join(" ")}
    >
      {icon}
    </button>
  );
}