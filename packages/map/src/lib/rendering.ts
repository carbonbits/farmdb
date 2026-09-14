/**
 * Turns the map's own layers into maplibre sublayers. A domain MapLayer knows
 * nothing about maplibre, so this file is where that translation lives: the
 * colours and sizes a layer is drawn with, the table of sublayers each geometry
 * class produces, and the helpers that build their ids and specs.
 */
import type {
  CircleLayerSpecification,
  FillLayerSpecification,
  LayerSpecification,
  LineLayerSpecification,
} from "maplibre-gl";
import type { GeometryClass, MapLayer } from "./layers";

const GREEN_FILL = "#4a8a54";
const GREEN_DARK = "#2c5a38";
const GREEN = "#346b41";
const CREAM = "#f4ead4";
const SELECTED_COLOR = "#d8a43b";
const FILL_OPACITY = 0.35;
const OUTLINE_WIDTH = 1.5;
const LINE_WIDTH = 3;
const SELECTED_WIDTH = 3;
const CIRCLE_RADIUS = 6;
const CIRCLE_STROKE_WIDTH = 2;

type SubLayer =
  | { role: string; type: "fill"; click?: boolean; paint: FillLayerSpecification["paint"] }
  | {
      role: string;
      type: "line";
      click?: boolean;
      selection?: boolean;
      paint: LineLayerSpecification["paint"];
    }
  | { role: string; type: "circle"; click?: boolean; paint: CircleLayerSpecification["paint"] };

const SUBLAYERS: Record<GeometryClass, SubLayer[]> = {
  polygon: [
    {
      role: "fill",
      type: "fill",
      click: true,
      paint: { "fill-color": GREEN_FILL, "fill-opacity": FILL_OPACITY },
    },
    {
      role: "outline",
      type: "line",
      paint: { "line-color": GREEN_DARK, "line-width": OUTLINE_WIDTH },
    },
    {
      role: "selected",
      type: "line",
      selection: true,
      paint: { "line-color": SELECTED_COLOR, "line-width": SELECTED_WIDTH },
    },
  ],
  line: [
    {
      role: "line",
      type: "line",
      click: true,
      paint: { "line-color": GREEN, "line-width": LINE_WIDTH },
    },
  ],
  point: [
    {
      role: "circle",
      type: "circle",
      click: true,
      paint: {
        "circle-radius": CIRCLE_RADIUS,
        "circle-color": GREEN,
        "circle-stroke-color": CREAM,
        "circle-stroke-width": CIRCLE_STROKE_WIDTH,
      },
    },
  ],
};

function sublayerId(layer: MapLayer, role: string): string {
  return `${layer.id}-${role}`;
}

export function mapLayerIds(layer: MapLayer): string[] {
  return SUBLAYERS[layer.geometry].map((sub) => sublayerId(layer, sub.role));
}

export function clickLayerId(layer: MapLayer): string {
  const target = SUBLAYERS[layer.geometry].find((sub) => sub.click);
  if (!target) throw new Error(`geometry ${layer.geometry} has no clickable sublayer`);
  return sublayerId(layer, target.role);
}

export function selectionLayerId(layer: MapLayer): string | null {
  const target = SUBLAYERS[layer.geometry].find((sub) => sub.type === "line" && sub.selection);
  return target ? sublayerId(layer, target.role) : null;
}

export function buildMaplibreLayers(layer: MapLayer): LayerSpecification[] {
  const source = `src-${layer.id}`;
  return SUBLAYERS[layer.geometry].map((sub) => {
    const base = { id: sublayerId(layer, sub.role), source, "source-layer": layer.id };
    if (sub.type === "fill") return { ...base, type: "fill", paint: sub.paint };
    if (sub.type === "circle") return { ...base, type: "circle", paint: sub.paint };
    if (sub.selection) {
      return { ...base, type: "line", paint: sub.paint, filter: ["==", ["get", "id"], ""] };
    }
    return { ...base, type: "line", paint: sub.paint };
  });
}
