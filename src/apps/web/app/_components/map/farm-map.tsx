"use client";

import { FeatureDetail } from "./components/feature-detail";
import { LayerToggle } from "./components/layer-toggle";
import { useFarmMap } from "./hooks/use-farm-map";

export function FarmMap() {
  const { containerRef, viewableLayers, visible, setVisible, selected, clearSelected } =
    useFarmMap();
  return (
    <div className="absolute inset-0">
      <div ref={containerRef} className="h-full w-full" />
      <LayerToggle layers={viewableLayers} visible={visible} onChange={setVisible} />
      {selected ? <FeatureDetail feature={selected} onClose={clearSelected} /> : null}
    </div>
  );
}
