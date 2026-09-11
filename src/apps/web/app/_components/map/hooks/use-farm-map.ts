"use client";
import { useAuth } from "@farmdb/api-client";
import { ApiClient as GeoApiClient } from "@farmdb/geo/client";
import { GeoApiError } from "@farmdb/geo/utils/errors/geo_api";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";
import { useMapDrawing } from "@/app/_components/map/hooks/use-map-drawing";
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
  clearSelectionHighlight,
  deleteSelectedFeature,
  loadLayers,
} from "@/app/_components/map/lib/controllers/map-controller";
import { useMapLayers, useSelection } from "@/app/_components/map/store";

maplibregl.setWorkerUrl(WORKER_URL);

/**
 * Owns the react lifecycle of the map: it creates the map once, loads the
 * layers the api serves when a token is ready, and keeps the toggle state
 * applied. Drawing is wired by a companion hook, and the map component reads
 * what it needs from the returned handles.
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
  const selected = useSelection((state) => state.selected);
  const setSelected = useSelection((state) => state.setSelected);
  const setDeleteError = useSelection((state) => state.setDeleteError);
  const [ready, setReady] = useState(false);
  const { startDrawing, cancelDrawing } = useMapDrawing(mapRef, clientRef, tokenRef, ready);

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
  }, [ready, accessToken, setLayers, setSelected]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    applyLayerVisibility(map, layers, visible);
  }, [visible, ready, layers]);

  const deleteSelected = async (): Promise<void> => {
    const map = mapRef.current;
    const client = clientRef.current;
    const token = tokenRef.current;
    if (!selected || !map || !client || !token) {
      setDeleteError("error");
      return;
    }
    try {
      await deleteSelectedFeature(map, client, token, selected);
      clearSelectionHighlight(map, layers);
      setSelected(null);
    } catch (error) {
      setDeleteError(error instanceof GeoApiError && error.status === 403 ? "forbidden" : "error");
    }
  };

  return {
    containerRef,
    viewableLayers: layers,
    visible,
    setVisible,
    deleteSelected,
    startDrawing,
    cancelDrawing,
  };
}