import type { SVGProps } from "react";

interface LogoProps extends SVGProps<SVGSVGElement> {
  title?: string;
}

// FarmDB logomark: eight growing orange squares connected in a circular network.
// viewBox is tightened to the mark's bounds (the source art is centered in a wider canvas).
export function Logo({ title = "FarmDB", ...props }: LogoProps) {
  return (
    <svg
      viewBox="220 41 232 240"
      role="img"
      aria-label={title}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <title>{title}</title>
      <g transform="translate(340,165)">
        <polygon
          points="95,0 67,67 0,95 -67,67 -95,0 -67,-67 0,-95 67,-67"
          fill="none"
          stroke="#E87914"
          strokeWidth="6"
          strokeLinejoin="round"
        />
        <rect x="86" y="-9" width="18" height="18" rx="3" fill="#FCC976" />
        <rect x="56" y="56" width="22" height="22" rx="3" fill="#F9B85A" />
        <rect x="-13" y="82" width="26" height="26" rx="4" fill="#F5A33C" />
        <rect x="-82" y="52" width="30" height="30" rx="4" fill="#EF8E26" />
        <rect x="-112" y="-17" width="34" height="34" rx="5" fill="#E87914" />
        <rect x="-86" y="-86" width="38" height="38" rx="5" fill="#D9660C" />
        <rect x="-21" y="-116" width="42" height="42" rx="6" fill="#C25408" />
        <rect x="44" y="-90" width="46" height="46" rx="6" fill="#A84405" />
      </g>
    </svg>
  );
}
