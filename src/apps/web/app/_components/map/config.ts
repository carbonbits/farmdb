import type { LayerSpecification, StyleSpecification } from "maplibre-gl";

export type GeometryClass = "polygon" | "line" | "point";

export interface MapLayer {
  id: string;
  label: string;
  geometry: GeometryClass;
  seasonal: boolean;
  view: string;
}

const GREEN_FILL = "#4a8a54";
const GREEN_DARK = "#2c5a38";
const GREEN = "#346b41";
const CREAM = "#f4ead4";

export const SELECTED_COLOR = "#d8a43b";
export const SELECTED_WIDTH = 3;

export const LAYERS: MapLayer[] = [
  { id: "fields", label: "Fields", geometry: "polygon", seasonal: false, view: "fields.view" },
  {
    id: "infrastructure",
    label: "Infrastructure",
    geometry: "line",
    seasonal: false,
    view: "fields.view",
  },
  { id: "markers", label: "Markers", geometry: "point", seasonal: false, view: "fields.view" },
];

export function mapLayerIds(layer: MapLayer): string[] {
  if (layer.geometry === "polygon")
    return [`${layer.id}-fill`, `${layer.id}-outline`, `${layer.id}-selected`];
  if (layer.geometry === "line") return [`${layer.id}-line`];
  return [`${layer.id}-circle`];
}

export function clickLayerId(layer: MapLayer): string {
  if (layer.geometry === "polygon") return `${layer.id}-fill`;
  if (layer.geometry === "line") return `${layer.id}-line`;
  return `${layer.id}-circle`;
}

export function buildMaplibreLayers(layer: MapLayer): LayerSpecification[] {
  const src = `src-${layer.id}`;
  if (layer.geometry === "polygon") {
    return [
      {
        id: `${layer.id}-fill`,
        type: "fill",
        source: src,
        "source-layer": layer.id,
        paint: { "fill-color": GREEN_FILL, "fill-opacity": 0.35 },
      },
      {
        id: `${layer.id}-outline`,
        type: "line",
        source: src,
        "source-layer": layer.id,
        paint: { "line-color": GREEN_DARK, "line-width": 1.5 },
      },
      {
        id: `${layer.id}-selected`,
        type: "line",
        source: src,
        "source-layer": layer.id,
        paint: { "line-color": SELECTED_COLOR, "line-width": SELECTED_WIDTH },
        filter: ["==", ["get", "id"], ""],
      },
    ];
  }
  if (layer.geometry === "line") {
    return [
      {
        id: `${layer.id}-line`,
        type: "line",
        source: src,
        "source-layer": layer.id,
        paint: { "line-color": GREEN, "line-width": 3 },
      },
    ];
  }
  return [
    {
      id: `${layer.id}-circle`,
      type: "circle",
      source: src,
      "source-layer": layer.id,
      paint: {
        "circle-radius": 6,
        "circle-color": GREEN,
        "circle-stroke-color": CREAM,
        "circle-stroke-width": 2,
      },
    },
  ];
}

export const BASE_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
    },
  },
  layers: [{ id: "osm", type: "raster", source: "osm" }],
};

export const FALLBACK_CENTER: [number, number] = [0, 0];
export const FALLBACK_ZOOM = 1;

export const TILE_PATH = "/v1/tiles";

export function tileUrl(layerId: string): string {
  return `${window.location.origin}${TILE_PATH}/${layerId}/{z}/{x}/{y}.mvt`;
}

export const WORKER_URL = "/maplibre-gl-worker.mjs";

export const FIT_PADDING = 60;
export const FIT_MAX_ZOOM = 17;
