"use client";

import { farmdbApi, useFarmdbApi } from "@farmdb/api-client";
import { LAYER_FEATURES_PATH } from "@farmdb/field-manager/manager/_data/endpoints/layer-features";

/** The shapes saved on one map layer, cached and shared by every screen that shows them. */
export function useLayerFeatures(layerId: string) {
  return useFarmdbApi(`${LAYER_FEATURES_PATH}#${layerId}`, (authOptions) =>
    farmdbApi.GET(LAYER_FEATURES_PATH, {
      ...authOptions,
      params: { path: { collection_id: layerId } },
    }),
  );
}
