"use client";

import { useLayerFeatures } from "@farmdb/field-manager/manager/_data/fetchers/use-layer-features";
import { FEATURE_LAYER_IDS } from "@farmdb/field-manager/manager/setup/_config";

/** How many paddocks, structures and water shapes are saved, added together. */
export function useFeatureCount(): number {
  const [paddocksLayer, structuresLayer, waterLayer] = FEATURE_LAYER_IDS;
  const paddocks = useLayerFeatures(paddocksLayer);
  const structures = useLayerFeatures(structuresLayer);
  const water = useLayerFeatures(waterLayer);
  return [paddocks, structures, water].reduce(
    (total, layer) => total + (layer.data?.features.length ?? 0),
    0,
  );
}
