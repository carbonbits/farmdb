import { formatHectares, polygonAreaHectares } from "@farmdb/field-manager/utils/area";
import type { PolygonRings } from "@farmdb/field-manager/utils/geometry";

/** The area the saved boundary encloses, shown over the map's top right corner. */
export function AreaMeter({ rings }: { rings: PolygonRings }) {
  return (
    <p className="absolute top-3 right-3 rounded-lg border border-parchment bg-white/95 px-2.5 py-1 text-[12px] font-semibold text-soil shadow-sm">
      Enclosed {formatHectares(polygonAreaHectares(rings))}
    </p>
  );
}
