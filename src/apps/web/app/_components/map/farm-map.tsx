"use client";

import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { GeoFeature } from "@farmdb/api-client";
import { geoApi, useAuth } from "@farmdb/api-client";
import { useEffect, useRef, useState } from "react";
import { FeatureDetail } from "./components/feature-detail";
import { LayerToggle } from "./components/layer-toggle";
import type { MapLayer } from "./config";
import {
  BASE_STYLE,
  buildMaplibreLayers,
  clickLayerId,
  FALLBACK_CENTER,
  FALLBACK_ZOOM,
  FIT_MAX_ZOOM,
  FIT_PADDING,
  mapLayerIds,
  tilePrefix,
  tileUrl,
  WORKER_URL,
} from "./config";
import { featuresToBbox } from "./lib/bounds";
import { useMapLayers } from "./store";

maplibregl.setWorkerUrl(WORKER_URL);

export function FarmMap() {
  const { accessToken, hasPermission } = useAuth();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  const tokenRef = useRef<string | null>(accessToken);
  tokenRef.current = accessToken;

  const permRef = useRef(hasPermission);
  permRef.current = hasPermission;

  const layers = useMapLayers((s) => s.layers);
  const visible = useMapLayers((s) => s.visible);
  const setVisible = useMapLayers((s) => s.setVisible);

  const [ready, setReady] = useState(false);
  const [selected, setSelected] = useState<GeoFeature | null>(null);

  const visibleLayers = layers.filter((l) => hasPermission(l.view));

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const initLayers = useMapLayers.getState().layers.filter((l) => permRef.current(l.view));
    const prefix = tilePrefix();

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: BASE_STYLE,
      center: FALLBACK_CENTER,
      zoom: FALLBACK_ZOOM,
      transformRequest: (url) => {
        if (tokenRef.current && url.startsWith(prefix)) {
          return { url, headers: { Authorization: `Bearer ${tokenRef.current}` } };
        }
        return { url };
      },
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl(), "top-right");

    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(containerRef.current);

    map.on("load", () => {
      map.resize();
      const clickable: string[] = [];

      for (const layer of initLayers) {
        map.addSource(`src-${layer.id}`, {
          type: "vector",
          tiles: [tileUrl(layer.id)],
        });
        for (const spec of buildMaplibreLayers(layer)) {
          map.addLayer(spec);
        }
        clickable.push(clickLayerId(layer));
      }

      for (const id of clickable) {
        map.on("mouseenter", id, () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", id, () => {
          map.getCanvas().style.cursor = "";
        });
      }

      if (clickable.length > 0) {
        map.on("click", clickable, (e) => {
          const id = e.features?.[0]?.properties?.id;
          if (typeof id !== "string" || !tokenRef.current) return;

          for (const layer of initLayers) {
            if (layer.geometry === "polygon") {
              map.setFilter(`${layer.id}-selected`, ["==", ["get", "id"], id]);
            }
          }

          geoApi
            .getFeature(tokenRef.current, id)
            .then(setSelected)
            .catch(() => setSelected(null));
        });
      }

      setReady(true);
      void fitToData(map, tokenRef.current, initLayers);
    });

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    for (const layer of layers) {
      const on = visible[layer.id] ?? true;
      for (const id of mapLayerIds(layer)) {
        if (map.getLayer(id)) {
          map.setLayoutProperty(id, "visibility", on ? "visible" : "none");
        }
      }
    }
  }, [visible, ready, layers]);

  return (
    <div className="absolute inset-0">
      <div ref={containerRef} className="h-full w-full" />
      <LayerToggle layers={visibleLayers} visible={visible} onChange={setVisible} />
      {selected ? <FeatureDetail feature={selected} onClose={() => setSelected(null)} /> : null}
    </div>
  );
}

async function fitToData(
  map: maplibregl.Map,
  token: string | null,
  layers: MapLayer[],
): Promise<void> {
  if (!token) return;
  const features: GeoFeature[] = [];
  for (const layer of layers) {
    try {
      const fc = await geoApi.listFeatures(token, layer.id);
      features.push(...fc.features);
    } catch {}
  }
  const bbox = featuresToBbox(features);
  if (!bbox) return;
  const bounds = new maplibregl.LngLatBounds();
  bounds.extend([bbox[0], bbox[1]]);
  bounds.extend([bbox[2], bbox[3]]);
  map.fitBounds(bounds, { padding: FIT_PADDING, maxZoom: FIT_MAX_ZOOM, duration: 0 });
}
