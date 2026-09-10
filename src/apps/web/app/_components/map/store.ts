import { create } from "zustand";
import type { MapLayer } from "./lib/layers";

/**
 * The layers the map shows and which are toggled on. The list starts empty and
 * the map fills it from the API on load, so the API is the one source of what
 * layers exist and setLayers replaces the list for every reader at once.
 */
interface MapLayerState {
  layers: MapLayer[];
  visible: Record<string, boolean>;
  setLayers: (layers: MapLayer[]) => void;
  setVisible: (id: string, on: boolean) => void;
}

export const useMapLayers = create<MapLayerState>((set) => ({
  layers: [],
  visible: {},
  setLayers: (layers) => set({ layers }),
  setVisible: (id, on) => set((state) => ({ visible: { ...state.visible, [id]: on } })),
}));
