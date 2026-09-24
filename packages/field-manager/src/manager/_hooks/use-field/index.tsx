import { useFields } from "@farmdb/field-manager/manager/_data/fetchers/use-fields";
import type { Field } from "@farmdb/field-manager/types";

/**
 * One field, taken from the fields list already loaded, so opening it costs no
 * extra request. Returns null when nothing is selected or the field is gone.
 */
export function useField(fieldId: string | null): Field | null {
  const { data: fields } = useFields();
  if (!fieldId || !fields) return null;
  return fields.find((field) => field.id === fieldId) ?? null;
}
