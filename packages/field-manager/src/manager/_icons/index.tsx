const ICON_PROPS = {
  width: 16,
  height: 16,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

/** A folded map, used for the map view. */
export function MapIcon() {
  return (
    <svg {...ICON_PROPS} aria-hidden="true">
      <path d="M9 4 3 6.5v13.5l6-2.5 6 2.5 6-2.5V3l-6 2.5L9 4z" />
      <path d="M9 4v13.5M15 6.5V20" />
    </svg>
  );
}

/** A two by two grid, used for the cards view. */
export function CardsIcon() {
  return (
    <svg {...ICON_PROPS} aria-hidden="true">
      <rect x="3" y="3" width="7.5" height="7.5" rx="1.8" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.8" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.8" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.8" />
    </svg>
  );
}
