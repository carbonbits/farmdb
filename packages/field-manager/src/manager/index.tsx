"use client";

import { useField } from "@farmdb/field-manager/manager/_hooks/use-field";
import { useFieldsManager } from "@farmdb/field-manager/manager/_store";
import { FieldsCards } from "@farmdb/field-manager/manager/list/cards-mode";
import { FieldsMap } from "@farmdb/field-manager/manager/list/map-mode";
import { ViewSwitch } from "@farmdb/field-manager/manager/list/view-switch";
import { FieldPanel } from "@farmdb/field-manager/manager/view";

/**
 * The Fields screen: the farm's fields as a map or as cards. Selecting a field
 * opens its panel in a column on the left, whichever view is showing.
 */
export function FieldsManager() {
  const activeView = useFieldsManager((state) => state.view);
  const showView = useFieldsManager((state) => state.showView);
  const selectedFieldId = useFieldsManager((state) => state.selectedFieldId);
  const clearSelection = useFieldsManager((state) => state.clearSelection);
  const selectedField = useField(selectedFieldId);

  const fieldList =
    activeView === "cards" ? (
      <FieldsCards
        viewSwitch={<ViewSwitch activeView="cards" onChange={showView} floating={false} />}
      />
    ) : (
      <>
        <FieldsMap />
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
          <ViewSwitch activeView="map" onChange={showView} floating />
        </div>
      </>
    );

  return (
    <div
      className={[
        "grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)]",
        selectedField
          ? "grid-cols-[clamp(340px,34%,480px)_minmax(300px,1fr)]"
          : "grid-cols-[minmax(0,1fr)]",
      ].join(" ")}
    >
      {selectedField && (
        <aside className="relative z-[7] flex min-h-0 min-w-0 py-[18px] pl-[18px]">
          <FieldPanel field={selectedField} onClose={clearSelection} />
        </aside>
      )}
      <div className="relative min-h-0 min-w-0">{fieldList}</div>
    </div>
  );
}
