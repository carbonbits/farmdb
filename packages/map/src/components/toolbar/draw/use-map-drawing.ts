"use client";
import { fieldsApi, type FieldGeometry } from "@farmdb/api-client";
import type { GeoFeature } from "@farmdb/geo";
import type { ApiClient as GeoApiClient } from "@farmdb/geo/client";
import type { Map as MapLibreMap } from "maplibre-gl";
import { type RefObject, useEffect, useRef } from "react";
import { DrawTool } from "@farmdb/map/lib/controllers/draw-controller";
import type { MapLayer } from "@farmdb/map/components/toolbar/layers/model";
import { useDrawing, useSelection } from "@farmdb/map/store";

/* The one layer whose drawn shapes become field records, not bare geometry.
   Its id matches the fields layer the api serves. */
const FIELD_LAYER_ID = "fields";

/**
 * Wires the drawing and editing tools to the live map. It builds the tool once
 * the map is ready and tears it down on unmount, and turns a start, save or
 * cancel request into both a tool action and the ui state that reacts to it.
 * Drawing and editing share one tool, so starting one clears the other here.
 * The map lifecycle hook owns the map, so this takes the refs it holds rather
 * than making its own.
 */
export function useMapDrawing(
  mapRef: RefObject<MapLibreMap | null>,
  clientRef: RefObject<GeoApiClient | null>,
  tokenRef: RefObject<string | null>,
  ready: boolean,
) {
  const drawToolRef = useRef<DrawTool | null>(null);
  const setActiveLayer = useDrawing((state) => state.setActiveLayer);
  const setSaveError = useDrawing((state) => state.setSaveError);
  const setNamingField = useDrawing((state) => state.setNamingField);
  const setSelected = useSelection((state) => state.setSelected);
  const setEditing = useSelection((state) => state.setEditing);
  const setEditError = useSelection((state) => state.setEditError);

  useEffect(() => {
    const map = mapRef.current;
    const client = clientRef.current;
    if (!map || !client || !ready || drawToolRef.current) return;
    drawToolRef.current = new DrawTool(
      map,
      client,
      tokenRef,
      () => setActiveLayer(null),
      (message) => {
        setActiveLayer(null);
        setSaveError(message);
      },
      new Set([FIELD_LAYER_ID]),
      () => setNamingField(true),
    );
    return () => {
      drawToolRef.current?.destroy();
      drawToolRef.current = null;
    };
  }, [mapRef, clientRef, tokenRef, ready, setActiveLayer, setSaveError, setNamingField]);

  function startDrawing(layer: MapLayer): void {
    drawToolRef.current?.startDrawing(layer);
    setEditing(false);
    setEditError(null);
    setSaveError(null);
    setActiveLayer(layer.id);
  }

  function cancelDrawing(): void {
    drawToolRef.current?.cancelDrawing();
    setActiveLayer(null);
    setSaveError(null);
  }

  function startEditing(feature: GeoFeature, layer: MapLayer): void {
    drawToolRef.current?.startEditing(feature, layer);
    setActiveLayer(null);
    setSaveError(null);
    setEditError(null);
    setEditing(true);
  }

  async function saveEdit(): Promise<void> {
    const outcome = await drawToolRef.current?.saveEdit();
    if (outcome === "ok") {
      setSelected(null);
    } else {
      setEditError(outcome === "forbidden" ? "forbidden" : "error");
    }
  }

  function cancelEditing(): void {
    drawToolRef.current?.cancelEditing();
    setEditing(false);
    setEditError(null);
  }

  async function saveField(name: string, description?: string): Promise<void> {
    const tool = drawToolRef.current;
    const token = tokenRef.current;
    const geometry = tool?.pendingGeometry();
    if (!tool || !token || !geometry) return;
    try {
      await fieldsApi.create(token, { name, description, geometry: geometry as FieldGeometry });
      tool.clearPending();
      setNamingField(false);
      setSaveError(null);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Could not save the field.");
    }
  }

  function cancelNaming(): void {
    drawToolRef.current?.discardPending();
    setNamingField(false);
    setSaveError(null);
  }

  return {
    startDrawing,
    cancelDrawing,
    startEditing,
    saveEdit,
    cancelEditing,
    saveField,
    cancelNaming,
  };
}