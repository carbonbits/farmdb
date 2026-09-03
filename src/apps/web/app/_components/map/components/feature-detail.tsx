import type { GeoFeature } from "@farmdb/api-client";

export function FeatureDetail({ feature, onClose }: { feature: GeoFeature; onClose: () => void }) {
  const name = typeof feature.properties.name === "string" ? feature.properties.name : "Feature";
  return (
    <div className="absolute right-3 top-3 z-10 w-[280px] rounded-[10px] border border-[#eadfcb] bg-white p-4 shadow-lg">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[1.2px] text-[#957a5c]">
            {feature.layer}
          </div>
          <div className="font-serif text-[17px] font-semibold text-[#20160f]">{name}</div>
        </div>
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="flex h-7 w-7 flex-none items-center justify-center rounded-md text-[#957a5c] hover:bg-[#f4ead4]"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-[14px] w-[14px]"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
      <dl className="mt-3 flex flex-col gap-1.5 text-[12.5px]">
        <div className="flex justify-between gap-3">
          <dt className="text-[#957a5c]">Season</dt>
          <dd className="text-[#3f2d22]">{feature.season ?? "None"}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-[#957a5c]">Feature id</dt>
          <dd className="truncate font-mono text-[11px] text-[#3f2d22]">{feature.id}</dd>
        </div>
      </dl>
    </div>
  );
}
