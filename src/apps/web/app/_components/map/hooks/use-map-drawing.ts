"use client";
import type { ApiClient as GeoApiClient } from "@farmdb/geo/client";
import type { Map as MapLibreMap } from "maplibre-gl";
import { type RefObject, useEffect, useRef } from "react";
import { DrawTool } from "@/app/_components/map/lib/controllers/draw-controller";
import type { MapLayer } from "@/app/_components/map/lib/layers";
import { useDrawing } from "@/app/_components/map/store";

/**
 * Wires the drawing tool to the live map. It builds the tool once the map is
 * ready and tears it down on unmount, and turns a start or cancel request into
 * both a tool action and the drawing state the ui reacts to. The map lifecycle
 * hook owns the map, so this takes the refs it holds rather than making its own.
 */
export function useMapDrawing(
  mapRef: RefObject<MapLibreMap | null>,
  clientRef: RefObject<GeoApiClient | null>,
  tokenRef: RefObject<string | null>,
  ready: boolean,
) {
  const drawToolRef = useRef<DrawTool | null>(null);
  const setActiveLayer = useDrawing((state) => state.setActiveLayer);
  const setSaveFailed = useDrawing((state) => state.setSaveFailed);

  useEffect(() => {
    const map = mapRef.current;
    const client = clientRef.current;
    if (!map || !client || !ready || drawToolRef.current) return;
    drawToolRef.current = new DrawTool(
      map,
      client,
      tokenRef,
      () => setActiveLayer(null),
      () => {
        setActiveLayer(null);
        setSaveFailed(true);
      },
    );
    return () => {
      drawToolRef.current?.destroy();
      drawToolRef.current = null;
    };
  }, [mapRef, clientRef, tokenRef, ready, setActiveLayer, setSaveFailed]);

  function startDrawing(layer: MapLayer): void {
    drawToolRef.current?.startDrawing(layer);
    setSaveFailed(false);
    setActiveLayer(layer.id);
  }

  function cancelDrawing(): void {
    drawToolRef.current?.cancelDrawing();
    setActiveLayer(null);
  }

  return { startDrawing, cancelDrawing };
}
