"use client";

import { useFarmdbApi } from "@farmdb/api-client";
import { FIELDS_PATH } from "@farmdb/field-manager/manager/_data/endpoints/fields";
import type { Field } from "@farmdb/field-manager/types";

/** The signed-in user's fields, cached and shared by every screen that shows them. */
export function useFields() {
  return useFarmdbApi<Field[]>({ path: FIELDS_PATH });
}
