import type { Field } from "@farmdb/field-manager/types";
import { formatHectares } from "@farmdb/field-manager/utils/area";
import { NOT_RECORDED } from "@farmdb/field-manager/utils/labels";

/** One field as a card. Clicking it selects the field. */
export function FieldCard({
  field,
  isSelected,
  onSelect,
}: {
  field: Field;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={isSelected}
      onClick={onSelect}
      className={[
        "flex h-full w-full flex-col gap-2.5 rounded-[13px] border bg-[#fcf8f0] px-[15px] pt-3.5 pb-[13px] text-left text-[#20160f]",
        isSelected
          ? "border-[#346b41] shadow-[0_0_0_1px_#346b41]"
          : "border-[#eadfcb] hover:border-[#b49a78] hover:shadow-[0_6px_18px_rgba(20,14,9,0.08)]",
      ].join(" ")}
    >
      <span className="flex min-w-0 items-center gap-2">
        {/* The design's default field colour; it takes the crop colour once crops exist. */}
        <span aria-hidden="true" className="h-2.5 w-2.5 flex-none rounded-[3px] bg-[#7a9646]" />
        <span className="truncate text-[15px] font-bold tracking-[-0.2px]">{field.name}</span>
      </span>
      <span className="-mt-0.5 line-clamp-2 text-[12.5px] leading-[1.4] text-[#75583f]">
        {field.description || "No crop recorded"}
      </span>
      <span className="grid grid-cols-2 gap-x-2.5 gap-y-[9px] border-t border-[#eadfcb] pt-[11px]">
        <CardFact
          label="Area"
          value={formatHectares(field.area_ha)}
          isMissing={field.area_ha === null}
        />
        {/* The API does not return soil, slope or soil tests yet. Swap these for
            the field's values once it does. */}
        <CardFact label="Soil" value={NOT_RECORDED} isMissing />
        <CardFact label="Slope" value={NOT_RECORDED} isMissing />
        <CardFact label="Last soil test" value={NOT_RECORDED} isMissing />
      </span>
    </button>
  );
}

function CardFact({
  label,
  value,
  isMissing = false,
}: {
  label: string;
  value: string;
  isMissing?: boolean;
}) {
  return (
    <span className="block min-w-0">
      <span className="block text-[10px] font-bold tracking-[0.7px] text-[#957a5c] uppercase">
        {label}
      </span>
      <span
        className={[
          "mt-0.5 block truncate text-[13px]",
          isMissing ? "font-normal text-[#957a5c]" : "font-semibold",
        ].join(" ")}
      >
        {value}
      </span>
    </span>
  );
}
