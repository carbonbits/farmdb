import { create } from "zustand";

export type FieldsView = "map" | "cards";

/**
 * What the Fields screen is showing: the map or the cards, and which field is
 * selected. The selection survives switching views, so the panel and the
 * highlight stay put until the user closes them. The setup page opens over
 * both views and keeps the selection, so closing it brings everything back.
 */
interface FieldsManagerState {
  view: FieldsView;
  selectedFieldId: string | null;
  showView: (view: FieldsView) => void;
  selectField: (fieldId: string) => void;
  clearSelection: () => void;
  builderOpen: boolean;
  openBuilder: () => void;
  closeBuilder: () => void;
}

export const useFieldsManager = create<FieldsManagerState>((set) => ({
  view: "map",
  selectedFieldId: null,
  showView: (view) => set({ view }),
  selectField: (selectedFieldId) => set({ selectedFieldId }),
  clearSelection: () => set({ selectedFieldId: null }),
  builderOpen: false,
  openBuilder: () => set({ builderOpen: true }),
  closeBuilder: () => set({ builderOpen: false }),
}));
