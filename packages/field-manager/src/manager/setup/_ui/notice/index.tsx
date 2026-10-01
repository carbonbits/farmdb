import type { ReactNode } from "react";

/** A dashed box that explains why a step has nothing to do yet. */
export function Notice({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-[13px] border border-dashed border-wheat bg-cream px-5 py-8 text-center">
      <p className="text-[14px] font-semibold text-soil">{title}</p>
      <p className="mx-auto mt-1 max-w-[420px] text-[13px] text-umber">{children}</p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
