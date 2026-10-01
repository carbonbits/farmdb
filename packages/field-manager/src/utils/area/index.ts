import type { PolygonRings } from "@farmdb/field-manager/utils/geometry";
import { area } from "@turf/area";

const hectareFormat = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 1,
});

/** Formats an area in hectares for display, or says when it is missing. */
export function formatHectares(areaInHectares: number | null | undefined): string {
  if (areaInHectares == null) return "No area yet";
  return `${hectareFormat.format(areaInHectares)} ha`;
}

const SQUARE_METRES_PER_HECTARE = 10_000;

/** A polygon's area on the earth's surface in hectares. */
export function polygonAreaHectares(rings: PolygonRings): number {
  return area({ type: "Polygon", coordinates: rings }) / SQUARE_METRES_PER_HECTARE;
}
