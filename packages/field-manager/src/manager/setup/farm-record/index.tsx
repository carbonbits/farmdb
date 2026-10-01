"use client";

import { useFields } from "@farmdb/field-manager/manager/_data/fetchers/use-fields";
import { useFarmBoundary } from "@farmdb/field-manager/manager/_hooks/use-farm-boundary";
import { useFeatureCount } from "@farmdb/field-manager/manager/setup/_hooks/use-feature-count";
import { useFarmSetup } from "@farmdb/field-manager/manager/setup/_store";
import { SectionLabel } from "@farmdb/field-manager/manager/setup/_ui/section-label";
import {
  farmDisplayName,
  farmInitials,
} from "@farmdb/field-manager/manager/setup/_utils/farm-name";
import { BoundaryPreview } from "@farmdb/field-manager/manager/setup/farm-record/boundary-preview";
import { polygonRings } from "@farmdb/field-manager/utils/geometry";

/** Shown until the API can say who is on the farm. */
const NOT_AVAILABLE = "—";

/** A live summary of the farm as it is set up: what is saved and what is a draft. */
export function FarmRecord() {
  const draft = useFarmSetup((state) => state.draft);
  const { hasBoundary, boundary } = useFarmBoundary();
  const { data: fields } = useFields();
  const featureCount = useFeatureCount();
  const farmName = farmDisplayName(draft);
  const tracePoints = useFarmSetup((state) => state.tracePoints);
  const savedRings = boundary ? polygonRings(boundary.geometry) : null;
  const previewRings = savedRings ?? (tracePoints.length >= 2 ? [tracePoints] : null);

  return (
    <section className="rounded-[12px] border border-parchment bg-white p-4">
      <SectionLabel>Farm record</SectionLabel>
      <div className="mt-2.5 flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex h-9 w-9 flex-none items-center justify-center rounded-[10px] bg-fern text-[12px] font-bold text-cream"
        >
          {farmInitials(farmName)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[14px] font-bold">{farmName}</p>
          <p className="truncate text-[12px] text-umber">
            {draft.county.trim() || "No county yet"}
          </p>
        </div>
      </div>
      <BoundaryPreview rings={previewRings} />
      <dl className="mt-3 divide-y divide-parchment text-[13px]">
        <RecordRow label="Boundary" value={boundaryStatus(hasBoundary, tracePoints.length)} />
        <RecordRow label="Fields" value={String(fields?.length ?? 0)} />
        <RecordRow label="Features" value={String(featureCount)} />
        <RecordRow label="Members" value={NOT_AVAILABLE} />
        <RecordRow label="Status" value={hasBoundary ? "Boundary saved" : "Draft"} />
      </dl>
    </section>
  );
}

/** "Closed" once saved, "Open · N pts" while tracing, "Not drawn" before. */
function boundaryStatus(hasBoundary: boolean, cornerCount: number): string {
  if (hasBoundary) return "Closed";
  if (cornerCount > 0) return `Open · ${cornerCount} pts`;
  return "Not drawn";
}

function RecordRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <dt className="text-umber">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}
