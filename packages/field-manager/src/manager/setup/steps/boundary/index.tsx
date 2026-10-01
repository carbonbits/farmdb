"use client";

import { useFarmBoundary } from "@farmdb/field-manager/manager/_hooks/use-farm-boundary";
import { FARM_LAYER_ID } from "@farmdb/field-manager/manager/setup/_config";
import { useBoundaryHint } from "@farmdb/field-manager/manager/setup/_hooks/use-boundary-hint";
import { useBoundaryPermissions } from "@farmdb/field-manager/manager/setup/_hooks/use-boundary-permissions";
import { useFarmSetup } from "@farmdb/field-manager/manager/setup/_store";
import { SetupMap } from "@farmdb/field-manager/manager/setup/setup-map";
import { AreaMeter } from "@farmdb/field-manager/manager/setup/steps/boundary/area-meter";
import { FarmDetails } from "@farmdb/field-manager/manager/setup/steps/boundary/farm-details";
import { RedrawControl } from "@farmdb/field-manager/manager/setup/steps/boundary/redraw-control";
import { TraceControls } from "@farmdb/field-manager/manager/setup/steps/boundary/trace-controls";
import { useCloseBoundary } from "@farmdb/field-manager/manager/setup/steps/boundary/use-close-boundary";
import { useRemoveBoundary } from "@farmdb/field-manager/manager/setup/steps/boundary/use-remove-boundary";
import { polygonRings } from "@farmdb/field-manager/utils/geometry";
import type { ReactNode } from "react";

/**
 * Step one: the farm's details and its outer edge, traced corner by corner.
 * Closing the boundary saves it, which unlocks the other steps; a saved
 * boundary can be removed and traced again.
 */
export function BoundaryStep() {
  const { canTrace, canRemove } = useBoundaryPermissions();
  const { hasBoundary, boundary } = useFarmBoundary();
  const tracePoints = useFarmSetup((state) => state.tracePoints);
  const addTracePoint = useFarmSetup((state) => state.addTracePoint);
  const hint = useBoundaryHint();
  const closing = useCloseBoundary();
  const removing = useRemoveBoundary();
  const isTracing = canTrace && !hasBoundary;
  const boundaryRings = boundary ? polygonRings(boundary.geometry) : null;

  let actions: ReactNode = null;
  if (isTracing) {
    actions = <TraceControls isSaving={closing.isSaving} onClose={closing.closeBoundary} />;
  } else if (hasBoundary && canRemove) {
    actions = (
      <RedrawControl isRemoving={removing.isRemoving} onConfirm={removing.removeBoundary} />
    );
  }

  return (
    <div>
      <FarmDetails />
      <p className="mt-2 text-[12px] text-taupe">
        Draft only: the farm details stay on this screen until the farm record can be saved.
      </p>
      <div className="mt-5">
        <SetupMap
          title="Trace the outer edge"
          actions={actions}
          hint={hint}
          isTracing={isTracing}
          sketchPoints={isTracing ? tracePoints : []}
          onMapClick={addTracePoint}
          overlay={boundaryRings && <AreaMeter rings={boundaryRings} />}
          error={closing.error ?? removing.error}
          savedLayerId={FARM_LAYER_ID}
          savedVersion={String(boundary?.id ?? "")}
        />
      </div>
    </div>
  );
}
