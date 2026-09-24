const hectareFormat = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 1,
});

/** Formats an area in hectares for display, or says when it is missing. */
export function formatHectares(areaInHectares: number | null): string {
  if (areaInHectares === null) return "No area yet";
  return `${hectareFormat.format(areaInHectares)} ha`;
}
