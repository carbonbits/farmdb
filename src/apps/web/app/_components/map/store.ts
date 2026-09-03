import { create } from "zustand";
import { LAYERS, type MapLayer } from "./config";

interface MapLayerState {
  layers: MapLayer[];
  visible: Record<string, boolean>;
  setLayers: (layers: MapLayer[]) => void;
  setVisible: (id: string, on: boolean) => void;
}

export const useMapLayers = create<MapLayerState>((set) => ({
  layers: LAYERS,
  visible: {},
  setLayers: (layers) => set({ layers }),
  setVisible: (id, on) => set((state) => ({ visible: { ...state.visible, [id]: on } })),
}));
