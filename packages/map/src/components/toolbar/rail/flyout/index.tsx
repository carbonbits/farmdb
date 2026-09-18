import type { ReactNode } from "react";

/**
 * Places a tool's panel just to the left of the rail. The panel draws its own
 * box; this only positions it.
 */
export function Flyout({ children }: { children: ReactNode }) {
  return <div className="absolute right-full top-0 mr-2">{children}</div>;
}