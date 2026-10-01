"use client";

import { farmdbApi, unwrap, useAuthOptions } from "@farmdb/api-client";
import { LAYER_FEATURE_PATH } from "@farmdb/field-manager/manager/_data/endpoints/layer-features";

/** Removes one saved shape from a map layer, such as the farm boundary. */
export function useDeleteLayerFeature() {
  const authOptions = useAuthOptions();

  async function deleteLayerFeature(layerId: string, featureId: string): Promise<void> {
    if (!authOptions) {
      throw new Error("Not authenticated");
    }
    await unwrap(
      farmdbApi.DELETE(LAYER_FEATURE_PATH, {
        ...authOptions,
        params: { path: { collection_id: layerId, feature_id: featureId } },
      }),
    );
  }

  return { deleteLayerFeature };
}
