import type { PolygonRings } from "@farmdb/field-manager/utils/geometry";

const VIEW_SIZE = 100;

/**
 * A small drawing of the saved boundary, scaled to fit its box. Before a
 * boundary is saved the box stays empty, as in the design.
 */
export function BoundaryPreview({ rings }: { rings: PolygonRings | null }) {
  const outerRing = rings?.[0];

  return (
    <div className="mt-3 flex h-[78px] items-center justify-center rounded-[10px] border border-parchment bg-cream/60">
      {outerRing && (
        <svg
          viewBox={`0 0 ${VIEW_SIZE} ${VIEW_SIZE}`}
          className="h-[62px] w-[62px]"
          role="img"
          aria-label="Farm boundary outline"
        >
          <path
            d={outlinePath(outerRing)}
            className="fill-fern/20 stroke-fern"
            strokeWidth={2}
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      )}
    </div>
  );
}

// Fits the ring into the square view, keeping its shape, with north at the top.
function outlinePath(ring: number[][]): string {
  const longitudes = ring.map(([longitude]) => longitude);
  const latitudes = ring.map(([, latitude]) => latitude);
  const west = Math.min(...longitudes);
  const north = Math.max(...latitudes);
  const span = Math.max(Math.max(...longitudes) - west, north - Math.min(...latitudes)) || 1;

  const points = ring.map(([longitude, latitude]) => {
    const x = ((longitude - west) / span) * VIEW_SIZE;
    const y = ((north - latitude) / span) * VIEW_SIZE;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });
  return `M${points.join(" L")} Z`;
}
