"use client";

import { Rail } from "@farmdb/map/components/toolbar/rail";
import { useFarmMap } from "@farmdb/map/hooks/use-farm-map";

export function FarmMap() {
  const controls = useFarmMap();

  return (
    <div className="absolute inset-0">
      <div ref={controls.containerRef} className="h-full w-full" />
      <Rail controls={controls} />
    </div>
  );
}