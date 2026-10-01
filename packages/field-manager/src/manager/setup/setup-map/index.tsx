"use client";

import { SectionLabel } from "@farmdb/field-manager/manager/setup/_ui/section-label";
import { useFarmMap } from "@farmdb/map";
import { type ReactNode, useEffect, useRef } from "react";

/** The design's striped canvas: the palette's leaf green at two strengths. */
const CANVAS_CLASSES =
  "bg-cream bg-[repeating-linear-gradient(135deg,rgb(74_138_84/0.14)_0_22px,rgb(74_138_84/0.24)_22px_44px)]";

/** How much of the real map shows through the stripes: enough to find your land. */
const BASEMAP_OPACITY = 0.35;

/**
 * A titled map inside a setup step, drawn in the design's striped look with the
 * real map faintly underneath. It shows the farm's saved layers and the shape
 * being traced, reports taps while tracing, and carries the step's buttons
 * beside its title and a hint chip in its corner. The map credit sits top left,
 * clear of the hint.
 */
export function SetupMap({
  title,
  actions,
  hint,
  isTracing,
  sketchPoints,
  onMapClick,
  overlay,
  error,
  savedLayerId,
  savedVersion,
}: {
  title: string;
  actions?: ReactNode;
  hint: string;
  isTracing: boolean;
  sketchPoints: number[][];
  onMapClick: (point: number[]) => void;
  overlay?: ReactNode;
  error?: string | null;
  savedLayerId?: string;
  savedVersion?: string;
}) {
  const {
    containerRef,
    onMapClick: subscribeToClicks,
    showSketch,
    reloadLayer,
  } = useFarmMap({ attributionPosition: "top-left", basemapOpacity: BASEMAP_OPACITY });

  // Taps subscribe once per tracing session; the latest handler is always used.
  const clickHandlerRef = useRef(onMapClick);
  clickHandlerRef.current = onMapClick;
  useEffect(() => {
    if (!isTracing) return;
    return subscribeToClicks((point) => clickHandlerRef.current(point));
  }, [isTracing, subscribeToClicks]);

  useEffect(() => {
    showSketch(sketchPoints);
  }, [showSketch, sketchPoints]);

  // When the step saves or removes a shape, fetch that layer again so the map
  // shows the change without a page reload.
  const lastSavedVersionRef = useRef(savedVersion);
  useEffect(() => {
    if (!savedLayerId || lastSavedVersionRef.current === savedVersion) return;
    lastSavedVersionRef.current = savedVersion;
    reloadLayer(savedLayerId);
  }, [reloadLayer, savedLayerId, savedVersion]);

  return (
    <div>
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
        <SectionLabel>{title}</SectionLabel>
        {actions}
      </div>
      <div
        className={[
          "relative h-[400px] overflow-hidden rounded-[13px] border border-wheat",
          CANVAS_CLASSES,
          isTracing ? "[&_.maplibregl-canvas-container]:!cursor-crosshair" : "",
        ].join(" ")}
      >
        <div ref={containerRef} className="h-full w-full" />
        {overlay}
        <p className="absolute bottom-3 left-3 rounded-md bg-forest/85 px-2.5 py-1.5 font-mono text-[11.5px] text-cream">
          {hint}
        </p>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-[12.5px] font-semibold text-soil">
          {error}
        </p>
      )}
    </div>
  );
}
