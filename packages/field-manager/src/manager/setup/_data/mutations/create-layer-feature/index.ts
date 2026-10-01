"use client";

import { farmdbApi, unwrap, useAuthOptions } from "@farmdb/api-client";
import { LAYER_FEATURES_PATH } from "@farmdb/field-manager/manager/_data/endpoints/layer-features";
import type { PolygonRings } from "@farmdb/field-manager/utils/geometry";

/** Saves one polygon to a map layer, such as the farm boundary or a paddock. */
export function useCreateLayerFeature() {
  const authOptions = useAuthOptions();

  async function createLayerFeature(layerId: string, rings: PolygonRings): Promise<void> {
    if (!authOptions) {
      throw new Error("Not authenticated");
    }
    await unwrap(
      farmdbApi.POST(LAYER_FEATURES_PATH, {
        ...authOptions,
        params: { path: { collection_id: layerId } },
        body: { geometry: { type: "Polygon", coordinates: rings } },
      }),
    );
  }

  return { createLayerFeature };
}
