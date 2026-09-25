import { CardsIcon, MapIcon } from "@farmdb/field-manager/manager/_icons";
import type { FieldsView } from "@farmdb/field-manager/manager/_store";
import type { ReactNode } from "react";

const VIEW_OPTIONS: { view: FieldsView; label: string; icon: ReactNode }[] = [
  { view: "map", label: "Map", icon: <MapIcon /> },
  { view: "cards", label: "Cards", icon: <CardsIcon /> },
];

/**
 * Switches the field list between the map and the cards view. Over the map it
 * is a white floating bar; on the page it sits on the sand background.
 */
export function ViewSwitch({
  activeView,
  onChange,
  floating,
}: {
  activeView: FieldsView;
  onChange: (view: FieldsView) => void;
  floating: boolean;
}) {
  return (
    <fieldset
      aria-label="Fields view"
      className={[
        "m-0 inline-flex min-w-0 rounded-[10px] p-[3px]",
        floating
          ? "border border-parchment bg-white shadow-[0_4px_14px_rgba(20,14,9,0.1)]"
          : "border-0 bg-cream",
      ].join(" ")}
    >
      {VIEW_OPTIONS.map(({ view, label, icon }) => {
        const isActive = view === activeView;
        return (
          <button
            key={view}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(view)}
            className={[
              "inline-flex items-center gap-1.5 rounded-[8px] px-3.5 py-[7px] text-[12.5px] font-semibold",
              isActive ? "bg-white text-bark shadow-[0_1px_2px_rgba(0,0,0,0.1)]" : "text-umber",
            ].join(" ")}
          >
            {icon}
            {label}
          </button>
        );
      })}
    </fieldset>
  );
}
