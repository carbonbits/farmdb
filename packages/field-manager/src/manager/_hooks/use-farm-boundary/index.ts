"use client";

import { useLayerFeatures } from "@farmdb/field-manager/manager/_data/fetchers/use-layer-features";
import { FARM_LAYER_ID } from "@farmdb/field-manager/manager/setup/_config";

/**
 * Whether the farm boundary is saved. Until the answer arrives, or if it cannot
 * be loaded, the farm counts as having no boundary, so later steps stay locked.
 */
export function useFarmBoundary() {
  const { data, mutate } = useLayerFeatures(FARM_LAYER_ID);
  const boundary = data?.features[0] ?? null;
  return { hasBoundary: boundary !== null, boundary, reloadBoundary: mutate };
}
