"use client";

import type { GeoFeature } from "@farmdb/geo";
import { useSelection } from "@farmdb/map/store";

/**
 * The feature the user picked on the map, and a way to let it go. Clearing it
 * also removes its highlight, because the map follows the selection.
 */
export function useSelectedFeature(): {
  selected: GeoFeature | null;
  clearSelection: () => void;
} {
  const selected = useSelection((state) => state.selected);
  const setSelected = useSelection((state) => state.setSelected);
  return { selected, clearSelection: () => setSelected(null) };
}
