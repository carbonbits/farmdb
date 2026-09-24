"use client";

import { FieldsCards } from "@farmdb/field-manager/manager/list/cards-mode";
import { FieldsMap } from "@farmdb/field-manager/manager/list/map-mode";
import { type FieldsView, ViewSwitch } from "@farmdb/field-manager/manager/list/view-switch";
import { useState } from "react";

/** The Fields screen: the farm's fields as a map or as cards. */
export function FieldsManager() {
  const [activeView, setActiveView] = useState<FieldsView>("map");

  if (activeView === "cards") {
    return (
      <div className="relative min-h-0 flex-1">
        <FieldsCards
          viewSwitch={<ViewSwitch activeView="cards" onChange={setActiveView} floating={false} />}
        />
      </div>
    );
  }

  return (
    <div className="relative min-h-0 flex-1">
      <FieldsMap />
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
        <ViewSwitch activeView="map" onChange={setActiveView} floating />
      </div>
    </div>
  );
}
