import type { ReactNode } from "react";

/**
 * Places the map controls in the four corners. A corner stacks whatever it is
 * given, top to bottom.
 */
export function Toolbar({
  topLeft,
  topRight,
  bottomLeft,
  bottomRight,
}: {
  topLeft?: ReactNode;
  topRight?: ReactNode;
  bottomLeft?: ReactNode;
  bottomRight?: ReactNode;
}) {
  return (
    <>
      {topLeft ? (
        <div className="absolute left-3 top-3 z-10 flex flex-col items-start gap-2">{topLeft}</div>
      ) : null}
      {topRight ? (
        <div className="absolute right-3 top-3 z-10 flex flex-col items-end gap-2">{topRight}</div>
      ) : null}
      {bottomLeft ? (
        <div className="absolute bottom-3 left-3 z-10 flex flex-col items-start gap-2">
          {bottomLeft}
        </div>
      ) : null}
      {bottomRight ? (
        <div className="absolute bottom-3 right-3 z-10 flex flex-col items-end gap-2">
          {bottomRight}
        </div>
      ) : null}
    </>
  );
}