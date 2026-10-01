"use client";

import { useFarmBoundary } from "@farmdb/field-manager/manager/_hooks/use-farm-boundary";
import { useFarmSetup } from "@farmdb/field-manager/manager/setup/_store";
import {
  farmDisplayName,
  farmInitials,
} from "@farmdb/field-manager/manager/setup/_utils/farm-name";

/** How this edition treats farms, and the one farm this install holds. */
export function InstallFarms() {
  const draft = useFarmSetup((state) => state.draft);
  const { hasBoundary } = useFarmBoundary();
  const farmName = farmDisplayName(draft);

  return (
    <section className="rounded-[12px] border border-parchment bg-white p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-serif text-[16px] font-semibold">This install</h3>
        <span className="text-[11.5px] text-taupe">
          {hasBoundary ? "Boundary saved" : "No boundary"}
        </span>
      </div>
      <p className="mt-1 text-[12.5px] leading-[1.5] text-umber">
        Open core runs one farm per install. More plots are fields inside this boundary, not
        separate farms.
      </p>
      <div className="mt-3 flex items-center gap-2.5 border-t border-parchment pt-3">
        <span
          aria-hidden="true"
          className="flex h-7 w-7 flex-none items-center justify-center rounded-[8px] bg-fern text-[10.5px] font-bold text-cream"
        >
          {farmInitials(farmName)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold">{farmName}</p>
          <p className="truncate text-[11.5px] text-taupe">
            {hasBoundary ? "Boundary closed" : "Boundary not closed"}
          </p>
        </div>
        <span className="rounded-full bg-cream px-2.5 py-0.5 text-[11px] font-semibold text-umber">
          {hasBoundary ? "Set up" : "Empty"}
        </span>
      </div>
    </section>
  );
}
