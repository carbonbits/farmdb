"use client";

import { DrawToolbar } from "./components/draw-toolbar";
import { FeatureDetail } from "./components/feature-detail";
import { LayerToggle } from "./components/layer-toggle";
import { useFarmMap } from "./hooks/use-farm-map";
import { useDrawing, useSelection } from "./store";

export function FarmMap() {
  const {
    containerRef,
    viewableLayers,
    visible,
    setVisible,
    deleteSelected,
    startDrawing,
    cancelDrawing,
  } = useFarmMap();
  const activeLayerId = useDrawing((state) => state.activeLayerId);
  const saveFailed = useDrawing((state) => state.saveFailed);
  const selected = useSelection((state) => state.selected);
  const deleteError = useSelection((state) => state.deleteError);
  const setSelected = useSelection((state) => state.setSelected);
  return (
    <div className="absolute inset-0">
      <div ref={containerRef} className="h-full w-full" />
      <LayerToggle layers={viewableLayers} visible={visible} onChange={setVisible} />
      <DrawToolbar
        layers={viewableLayers}
        activeLayerId={activeLayerId}
        saveFailed={saveFailed}
        onDraw={startDrawing}
        onCancel={cancelDrawing}
      />
      {selected ? (
        <FeatureDetail
          feature={selected}
          deleteError={deleteError}
          onClose={() => setSelected(null)}
          onDelete={deleteSelected}
        />
      ) : null}
    </div>
  );
}