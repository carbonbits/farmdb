import type { GeoFeature } from "@farmdb/geo";
import { create } from "zustand";
import type { MapLayer } from "./lib/layers";

/**
 * The map ui state, kept in small stores the ui reacts to. One holds the layers
 * the map shows and which are toggled on. The list starts empty and the map
 * fills it from the api on load, so the api is the one source of what layers
 * exist. One holds the drawing state: the layer the user is drawing into, null
 * when idle, and whether the last save failed. One holds the selection state:
 * the feature the user picked, null when nothing is selected, and why the last
 * delete failed so the panel can show the right message. Live map objects like
 * the drawing tool stay out because they are not state the ui renders.
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

interface SelectionState {
  selected: GeoFeature | null;
  deleteError: "forbidden" | "error" | null;
  setSelected: (feature: GeoFeature | null) => void;
  setDeleteError: (error: "forbidden" | "error" | null) => void;
}

export const useSelection = create<SelectionState>((set) => ({
  selected: null,
  deleteError: null,
  setSelected: (selected) => set({ selected, deleteError: null }),
  setDeleteError: (deleteError) => set({ deleteError }),
}));