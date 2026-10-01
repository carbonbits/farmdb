"use client";

import { ApiError } from "@farmdb/api-client";
import { useFarmBoundary } from "@farmdb/field-manager/manager/_hooks/use-farm-boundary";
import { FARM_LAYER_ID } from "@farmdb/field-manager/manager/setup/_config";
import { useDeleteLayerFeature } from "@farmdb/field-manager/manager/setup/_data/mutations/delete-layer-feature";
import { useState } from "react";

const REMOVE_FAILED = "The boundary could not be removed. Check your connection and try again.";

/**
 * Removes the saved boundary so it can be traced again. The API decides
 * whether that is allowed; its reason shows if it refuses.
 */
export function useRemoveBoundary() {
  const { boundary, reloadBoundary } = useFarmBoundary();
  const { deleteLayerFeature } = useDeleteLayerFeature();
  const [isRemoving, setIsRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function removeBoundary(): Promise<void> {
    if (!boundary || isRemoving) return;
    setIsRemoving(true);
    setError(null);
    try {
      await deleteLayerFeature(FARM_LAYER_ID, boundary.id);
      await reloadBoundary();
    } catch (failure) {
      setError(failure instanceof ApiError ? failure.message : REMOVE_FAILED);
    } finally {
      setIsRemoving(false);
    }
  }

  return { removeBoundary, isRemoving, error };
}
