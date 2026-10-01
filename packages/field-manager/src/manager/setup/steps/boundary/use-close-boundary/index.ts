"use client";

import { ApiError } from "@farmdb/api-client";
import { useFarmBoundary } from "@farmdb/field-manager/manager/_hooks/use-farm-boundary";
import { FARM_LAYER_ID, MINIMUM_CORNERS } from "@farmdb/field-manager/manager/setup/_config";
import { useCreateLayerFeature } from "@farmdb/field-manager/manager/setup/_data/mutations/create-layer-feature";
import { useFarmSetup } from "@farmdb/field-manager/manager/setup/_store";
import { useState } from "react";

const SAVE_FAILED = "The boundary could not be saved. Check your connection and try again.";
const NEED_MORE_CORNERS = "Tap at least three corners on the map before closing the boundary.";

/**
 * Closes the traced corners into a boundary and saves it to the farm layer.
 * Asked too early, it saves nothing and says how many corners it needs; the
 * message goes away once there are enough. On success the trace is cleared and
 * the boundary reloaded, which unlocks the later steps; on failure the trace is
 * kept so nothing is lost.
 */
export function useCloseBoundary() {
  const tracePoints = useFarmSetup((state) => state.tracePoints);
  const clearTrace = useFarmSetup((state) => state.clearTrace);
  const { reloadBoundary } = useFarmBoundary();
  const { createLayerFeature } = useCreateLayerFeature();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [triedWithTooFewCorners, setTriedWithTooFewCorners] = useState(false);
  const hasEnoughCorners = tracePoints.length >= MINIMUM_CORNERS;
  const error =
    saveError ?? (triedWithTooFewCorners && !hasEnoughCorners ? NEED_MORE_CORNERS : null);

  async function closeBoundary(): Promise<void> {
    if (isSaving) return;
    if (!hasEnoughCorners) {
      setTriedWithTooFewCorners(true);
      return;
    }
    setIsSaving(true);
    setSaveError(null);
    setTriedWithTooFewCorners(false);
    try {
      const closedRing = [...tracePoints, tracePoints[0]];
      await createLayerFeature(FARM_LAYER_ID, [closedRing]);
      clearTrace();
      await reloadBoundary();
    } catch (failure) {
      setSaveError(failure instanceof ApiError ? failure.message : SAVE_FAILED);
    } finally {
      setIsSaving(false);
    }
  }

  return { closeBoundary, isSaving, error };
}
