import type { FarmDraft } from "@farmdb/field-manager/manager/setup/_store";

/** The farm's display name: what was typed, or a placeholder until then. */
export function farmDisplayName(draft: FarmDraft): string {
  return draft.name.trim() || "Unnamed farm";
}

/** Up to two initials for the farm's tile, such as "UF" for "Unnamed farm". */
export function farmInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}
