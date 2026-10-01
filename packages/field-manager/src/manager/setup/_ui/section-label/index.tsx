import type { ReactNode } from "react";

/** A small uppercase label above a card or section. */
export function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="text-[10px] font-bold tracking-[1.4px] text-taupe uppercase">{children}</p>;
}
