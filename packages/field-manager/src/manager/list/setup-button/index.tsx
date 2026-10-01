"use client";

import { BoxIcon } from "@farmdb/field-manager/manager/_icons";
import { useFieldsManager } from "@farmdb/field-manager/manager/_store";
import { Button } from "@farmdb/ui";

const LABEL = "Set up this farm";

/** The map controls' floating white style, the same family as the view switch over the map. */
const FLOATING_CLASSES =
  "inline-flex items-center gap-1.5 rounded-[11px] border border-parchment bg-white px-[13px] py-[9px] text-[13px] font-semibold text-soil shadow-[0_4px_14px_rgba(0,0,0,0.14)] hover:bg-cream";

/** Opens the farm setup, floating over the map or as a quiet button on the cards page. */
export function SetupButton({ floating }: { floating: boolean }) {
  const openBuilder = useFieldsManager((state) => state.openBuilder);

  if (floating) {
    return (
      <button type="button" onClick={openBuilder} className={FLOATING_CLASSES}>
        <BoxIcon />
        {LABEL}
      </button>
    );
  }
  return (
    <Button onClick={openBuilder}>
      <BoxIcon />
      {LABEL}
    </Button>
  );
}
