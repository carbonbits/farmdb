import { create } from "zustand";
import type { MapLayer } from "./lib/layers";

/**
 * The map ui state, kept in two small stores. One holds the layers the map
 * shows and which are toggled on. The list starts empty and the map fills it
 * from the api on load, so the api is the one source of what layers exist. The
 * other holds the drawing state the ui reacts to: the layer the user is drawing
 * into, null when idle, and whether the last save failed. The drawing tool
 * itself is not here because it is a live map object, not state the ui renders.
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

interface DrawingState {
  activeLayerId: string | null;
  saveFailed: boolean;
  setActiveLayer: (layerId: string | null) => void;
  setSaveFailed: (failed: boolean) => void;
}

export const useDrawing = create<DrawingState>((set) => ({
  activeLayerId: null,
  saveFailed: false,
  setActiveLayer: (activeLayerId) => set({ activeLayerId }),
  setSaveFailed: (saveFailed) => set({ saveFailed }),
}));
