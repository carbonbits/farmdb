import { CloseIcon } from "@farmdb/field-manager/manager/_icons";
import type { Field } from "@farmdb/field-manager/types";
import { formatHectares } from "@farmdb/field-manager/utils/area";
import { NOT_RECORDED } from "@farmdb/field-manager/utils/labels";
import { useState } from "react";

const RECORD_TABS = [
  { id: "plantings", label: "Plantings" },
  { id: "inputs", label: "Inputs" },
  { id: "tasks", label: "Tasks" },
  { id: "yields", label: "Yields" },
  { id: "costs", label: "Costs" },
] as const;

type RecordTabId = (typeof RECORD_TABS)[number]["id"];

/** The selected field: its details and the records that hang off it. */
export function FieldPanel({ field, onClose }: { field: Field; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<RecordTabId>("plantings");
  const activeLabel = RECORD_TABS.find((tab) => tab.id === activeTab)?.label ?? "";

  return (
    <section
      aria-label={`Field ${field.name}`}
      className="h-full w-full overflow-y-auto rounded-[10px] border border-white/65 bg-white p-5 text-[#20160f] shadow-[0_20px_54px_rgba(20,14,9,0.28)]"
    >
      <header className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold tracking-[1.4px] text-[#957a5c] uppercase">Field</p>
          <h2 className="truncate font-serif text-[22px] font-semibold tracking-[-0.3px]">
            {field.name}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close field"
          className="flex h-10 w-10 flex-none items-center justify-center rounded-[11px] border border-[#eadfcb] bg-white text-[#3f2d22] hover:bg-[#f4ead4]"
        >
          <CloseIcon />
        </button>
      </header>
      <p className="mt-1 text-[13px] text-[#75583f]">{field.description || "No crop recorded"}</p>

      {/* The API does not return these attributes yet. Swap each for the
          field's value once it does. */}
      <dl className="grid grid-cols-2 gap-x-[18px] gap-y-4 py-4">
        <PanelFact
          label="Area"
          value={formatHectares(field.area_ha)}
          isMissing={field.area_ha === null}
        />
        <PanelFact label="Soil" value={NOT_RECORDED} isMissing />
        <PanelFact label="Slope" value={NOT_RECORDED} isMissing />
        <PanelFact label="Drainage" value={NOT_RECORDED} isMissing />
        <PanelFact label="Elevation" value={NOT_RECORDED} isMissing />
        <PanelFact label="Last soil test" value={NOT_RECORDED} isMissing />
      </dl>

      <div className="border-t border-[#eadfcb] pt-3.5">
        <p className="mt-1.5 mb-1 text-[11px] font-bold tracking-[1.2px] text-[#957a5c] uppercase">
          Records derived from this field
        </p>
        <div className="mt-1.5 flex flex-wrap gap-1 rounded-[12px] bg-[#f4ead4] p-1">
          {RECORD_TABS.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => setActiveTab(tab.id)}
                className={[
                  "rounded-[9px] px-[13px] py-[7px] text-[13px] font-semibold",
                  isActive
                    ? "bg-white text-[#20160f] shadow-[0_1px_3px_rgba(0,0,0,0.1)]"
                    : "text-[#75583f]",
                ].join(" ")}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        <p className="mt-1 border-t border-[#eadfcb] py-[13px] text-[13px] text-[#957a5c]">
          No {activeLabel.toLowerCase()} recorded for this field yet.
        </p>
      </div>
    </section>
  );
}

function PanelFact({
  label,
  value,
  isMissing = false,
}: {
  label: string;
  value: string;
  isMissing?: boolean;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-[10.5px] font-bold tracking-[0.8px] text-[#957a5c] uppercase">{label}</dt>
      <dd
        className={[
          "mt-[3px] truncate text-[14.5px]",
          isMissing ? "font-normal text-[#957a5c]" : "font-semibold",
        ].join(" ")}
      >
        {value}
      </dd>
    </div>
  );
}
