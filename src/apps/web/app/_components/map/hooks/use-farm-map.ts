"use client";
import { useAuth } from "@farmdb/api-client";
import { featuresToBbox, type GeoFeature } from "@farmdb/geo";
import { ApiClient as GeoApiClient } from "@farmdb/geo/client";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";
import {
  BASE_STYLE,
  FALLBACK_CENTER,
  FALLBACK_ZOOM,
  FIT_MAX_ZOOM,
  FIT_PADDING,
  featuresUrl,
  tilePrefix,
  tileUrl,
  WORKER_URL,
} from "@/app/_components/map/lib/config";
import type { MapLayer } from "@/app/_components/map/lib/layers";
import {
  buildMaplibreLayers,
  clickLayerId,
  mapLayerIds,
  selectionLayerId,
} from "@/app/_components/map/lib/rendering";
import { useMapLayers } from "@/app/_components/map/store";

maplibregl.setWorkerUrl(WORKER_URL);

type TokenRef = { current: string | null };

/**
 * Owns the whole life of the map. It creates the map in the container, loads a
 * source and styled sublayers for every layer the user may view, lets the user
 * click a feature to select it, and frames the view around the farm's data. A
 * component that uses this only has to render the container and the panels.
 */
export function useFarmMap() {
  const { accessToken, hasPermission } = useAuth();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const tokenRef = useRef<string | null>(accessToken);
  tokenRef.current = accessToken;
  const permRef = useRef(hasPermission);
  permRef.current = hasPermission;
  const layers = useMapLayers((state) => state.layers);
  const visible = useMapLayers((state) => state.visible);
  const setVisible = useMapLayers((state) => state.setVisible);
  const [ready, setReady] = useState(false);
  const [selected, setSelected] = useState<GeoFeature | null>(null);
  const viewableLayers = layers.filter((layer) => hasPermission(layer.view));

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const layersToLoad = useMapLayers
      .getState()
      .layers.filter((layer) => permRef.current(layer.view));
    const geoClient = new GeoApiClient({ featuresUrl: featuresUrl() });

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: BASE_STYLE,
      center: FALLBACK_CENTER,
      zoom: FALLBACK_ZOOM,
      transformRequest: attachTokenToTileRequests(tokenRef, tilePrefix()),
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl(), "top-right");

    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(containerRef.current);

    map.on("load", () => {
      map.resize();
      const clickableLayerIds = addLayersToMap(map, layersToLoad);
      showPointerOnHover(map, clickableLayerIds);
      bindFeatureSelect(map, layersToLoad, clickableLayerIds, geoClient, tokenRef, setSelected);
      setReady(true);
      void fitToData(map, geoClient, tokenRef.current, layersToLoad);
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
    applyLayerVisibility(map, layers, visible);
  }, [visible, ready, layers]);

  return {
    containerRef,
    viewableLayers,
    visible,
    setVisible,
    selected,
    clearSelected: () => setSelected(null),
  };
}

// Attaches the current bearer token to tile requests only. The tile prefix check
// is the security boundary: it keeps the token from ever reaching the basemap or
// any other host.
function attachTokenToTileRequests(tokenRef: TokenRef, tilePrefixUrl: string) {
  return (url: string) => {
    if (tokenRef.current && url.startsWith(tilePrefixUrl)) {
      return { url, headers: { Authorization: `Bearer ${tokenRef.current}` } };
    }
    return { url };
  };
}

// Adds a vector source and its styled sublayers for each layer, and returns the
// ids of the sublayers a user can click.
function addLayersToMap(map: maplibregl.Map, layers: MapLayer[]): string[] {
  const clickableLayerIds: string[] = [];
  for (const layer of layers) {
    map.addSource(`src-${layer.id}`, { type: "vector", tiles: [tileUrl(layer.id)] });
    for (const spec of buildMaplibreLayers(layer)) {
      map.addLayer(spec);
    }
    clickableLayerIds.push(clickLayerId(layer));
  }
  return clickableLayerIds;
}

function showPointerOnHover(map: maplibregl.Map, layerIds: string[]): void {
  for (const id of layerIds) {
    map.on("mouseenter", id, () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", id, () => {
      map.getCanvas().style.cursor = "";
    });
  }
}

function bindFeatureSelect(
  map: maplibregl.Map,
  layers: MapLayer[],
  clickableLayerIds: string[],
  client: GeoApiClient,
  tokenRef: TokenRef,
  onSelect: (feature: GeoFeature | null) => void,
): void {
  if (clickableLayerIds.length === 0) return;
  map.on("click", clickableLayerIds, (event) => {
    const featureId = event.features?.[0]?.properties?.id;
    if (typeof featureId !== "string" || !tokenRef.current) return;
    highlightSelection(map, layers, featureId);
    client
      .getFeature(tokenRef.current, featureId)
      .then(onSelect)
      // A failed load just closes the panel rather than showing a broken one.
      .catch(() => onSelect(null));
  });
}

// Points the selection outline at the clicked feature on every layer that has one.
function highlightSelection(map: maplibregl.Map, layers: MapLayer[], featureId: string): void {
  for (const layer of layers) {
    const selectionId = selectionLayerId(layer);
    if (selectionId) {
      map.setFilter(selectionId, ["==", ["get", "id"], featureId]);
    }
  }
}

function applyLayerVisibility(
  map: maplibregl.Map,
  layers: MapLayer[],
  visible: Record<string, boolean>,
): void {
  for (const layer of layers) {
    const isVisible = visible[layer.id] ?? true;
    for (const id of mapLayerIds(layer)) {
      if (map.getLayer(id)) {
        map.setLayoutProperty(id, "visibility", isVisible ? "visible" : "none");
      }
    }
  }
}

async function fitToData(
  map: maplibregl.Map,
  client: GeoApiClient,
  token: string | null,
  layers: MapLayer[],
): Promise<void> {
  if (!token) return;
  const features: GeoFeature[] = [];
  for (const layer of layers) {
    try {
      const collection = await client.listFeatures(token, layer.id);
      features.push(...collection.features);
    } catch {
      // A layer the user cannot read contributes nothing to the view.
    }
  }
  const bbox = featuresToBbox(features);
  if (!bbox) return;
  const bounds = new maplibregl.LngLatBounds();
  bounds.extend([bbox[0], bbox[1]]);
  bounds.extend([bbox[2], bbox[3]]);
  map.fitBounds(bounds, { padding: FIT_PADDING, maxZoom: FIT_MAX_ZOOM, duration: 0 });
}
