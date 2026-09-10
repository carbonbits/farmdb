"use client";

import { DrawToolbar } from "./components/draw-toolbar";
import { FeatureDetail } from "./components/feature-detail";
import { LayerToggle } from "./components/layer-toggle";
import { useFarmMap } from "./hooks/use-farm-map";
import { useDrawing } from "./store";

export function FarmMap() {
  const {
    containerRef,
    viewableLayers,
    visible,
    setVisible,
    selected,
    clearSelected,
    startDrawing,
    cancelDrawing,
  } = useFarmMap();
  const activeLayerId = useDrawing((state) => state.activeLayerId);
  const saveFailed = useDrawing((state) => state.saveFailed);
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
      {selected ? <FeatureDetail feature={selected} onClose={clearSelected} /> : null}
    </div>
  );
}
