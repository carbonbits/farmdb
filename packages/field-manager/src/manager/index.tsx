"use client";

import { useFieldsManager } from "@farmdb/field-manager/manager/_store";
import { FieldsCards } from "@farmdb/field-manager/manager/list/cards-mode";
import { FieldsMap } from "@farmdb/field-manager/manager/list/map-mode";
import { ViewSwitch } from "@farmdb/field-manager/manager/list/view-switch";

/** The Fields screen: the farm's fields as a map or as cards. */
export function FieldsManager() {
  const activeView = useFieldsManager((state) => state.view);
  const showView = useFieldsManager((state) => state.showView);

  if (activeView === "cards") {
    return (
      <div className="relative min-h-0 flex-1">
        <FieldsCards
          viewSwitch={<ViewSwitch activeView="cards" onChange={showView} floating={false} />}
        />
      </div>
    );
  }

  return (
    <div className="relative min-h-0 flex-1">
      <FieldsMap />
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
        <ViewSwitch activeView="map" onChange={showView} floating />
      </div>
    </div>
  );
}
