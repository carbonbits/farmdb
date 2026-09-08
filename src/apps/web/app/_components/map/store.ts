import { create } from "zustand";
import type { MapLayer } from "./lib/layers";

/**
 * The layers the map starts with. This is the default until the backend serves
 * the list, at which point setLayers replaces it and every reader updates with it.
 */
const DEFAULT_LAYERS: MapLayer[] = [
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

interface MapLayerState {
  layers: MapLayer[];
  visible: Record<string, boolean>;
  setLayers: (layers: MapLayer[]) => void;
  setVisible: (id: string, on: boolean) => void;
}

export const useMapLayers = create<MapLayerState>((set) => ({
  layers: DEFAULT_LAYERS,
  visible: {},
  setLayers: (layers) => set({ layers }),
  setVisible: (id, on) => set((state) => ({ visible: { ...state.visible, [id]: on } })),
}));
