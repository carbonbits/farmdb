import type { Field } from "@farmdb/field-manager/types";
import { formatHectares } from "@farmdb/field-manager/utils/area";

/** One field as a card: its name, description and area. */
export function FieldCard({ field }: { field: Field }) {
  return (
    <article className="flex h-full flex-col gap-2.5 rounded-[13px] border border-[#eadfcb] bg-[#fcf8f0] px-[15px] pt-3.5 pb-[13px] text-[#20160f] hover:border-[#b49a78] hover:shadow-[0_6px_18px_rgba(20,14,9,0.08)]">
      <h3 className="truncate text-[15px] font-bold tracking-[-0.2px]">{field.name}</h3>
      {field.description && (
        <p className="-mt-0.5 line-clamp-2 text-[12.5px] leading-[1.4] text-[#75583f]">
          {field.description}
        </p>
      )}
      <dl className="mt-auto border-t border-[#eadfcb] pt-[11px]">
        <dt className="text-[10px] font-bold tracking-[0.7px] text-[#957a5c] uppercase">Area</dt>
        <dd className="mt-0.5 text-[13px] font-semibold">{formatHectares(field.area_ha)}</dd>
      </dl>
    </article>
  );
}
