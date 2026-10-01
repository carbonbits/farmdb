"use client";

import { useFarmBoundary } from "@farmdb/field-manager/manager/_hooks/use-farm-boundary";
import { useBoundaryPermissions } from "@farmdb/field-manager/manager/setup/_hooks/use-boundary-permissions";
import { useFarmSetup } from "@farmdb/field-manager/manager/setup/_store";

/** What to do next on the boundary step, in one short sentence. */
export function useBoundaryHint(): string {
  const { canTrace, canRemove } = useBoundaryPermissions();
  const { hasBoundary } = useFarmBoundary();
  const cornerCount = useFarmSetup((state) => state.tracePoints.length);

  if (hasBoundary) {
    return canRemove ? "Boundary saved. Redraw it to start again." : "Boundary saved.";
  }
  if (!canTrace) return "You can view the map but not change it.";
  if (cornerCount === 0) return "Tap the map to drop the first corner.";
  return "Keep tapping the edge, then close the boundary.";
}
