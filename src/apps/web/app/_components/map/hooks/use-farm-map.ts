"use client";
import { useAuth } from "@farmdb/api-client";
import type { GeoFeature } from "@farmdb/geo";
import { ApiClient as GeoApiClient } from "@farmdb/geo/client";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";
import {
  BASE_STYLE,
  FALLBACK_CENTER,
  FALLBACK_ZOOM,
  mapsPrefix,
  mapsUrl,
  WORKER_URL,
} from "@/app/_components/map/lib/config";
import {
  applyLayerVisibility,
  attachTokenToMapRequests,
  loadLayers,
} from "@/app/_components/map/lib/map-controller";
import { useMapLayers } from "@/app/_components/map/store";

maplibregl.setWorkerUrl(WORKER_URL);

/**
 * Owns the react lifecycle of the map: it creates the map once, loads the
 * layers the api serves when a token is ready, keeps the toggle state applied,
 * and exposes what a component needs to render the container and panels.
 */
export function useFarmMap() {
  const { accessToken } = useAuth();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const clientRef = useRef<GeoApiClient | null>(null);
  const tokenRef = useRef<string | null>(accessToken);
  tokenRef.current = accessToken;
  const loadedRef = useRef(false);
  const layers = useMapLayers((state) => state.layers);
  const visible = useMapLayers((state) => state.visible);
  const setLayers = useMapLayers((state) => state.setLayers);
  const setVisible = useMapLayers((state) => state.setVisible);
  const [ready, setReady] = useState(false);
  const [selected, setSelected] = useState<GeoFeature | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    clientRef.current = new GeoApiClient({ mapsUrl: mapsUrl() });

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: BASE_STYLE,
      center: FALLBACK_CENTER,
      zoom: FALLBACK_ZOOM,
      transformRequest: attachTokenToMapRequests(tokenRef, mapsPrefix()),
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl(), "top-right");

    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(containerRef.current);

    map.on("load", () => {
      map.resize();
      setReady(true);
    });

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const client = clientRef.current;
    if (!map || !client || !ready || !accessToken || loadedRef.current) return;
    loadedRef.current = true;
    void loadLayers(map, client, accessToken, tokenRef, setLayers, setSelected);
  }, [ready, accessToken, setLayers]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    applyLayerVisibility(map, layers, visible);
  }, [visible, ready, layers]);

  return {
    containerRef,
    viewableLayers: layers,
    visible,
    setVisible,
    selected,
    clearSelected: () => setSelected(null),
  };
}
