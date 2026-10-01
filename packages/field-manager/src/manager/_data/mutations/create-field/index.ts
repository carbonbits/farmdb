"use client";

import { farmdbApi, unwrap, useAuthOptions } from "@farmdb/api-client";
import { FIELDS_PATH } from "@farmdb/field-manager/manager/_data/endpoints/fields";
import { useFields } from "@farmdb/field-manager/manager/_data/fetchers/use-fields";
import { type CreateFieldInput, type Field, toField } from "@farmdb/field-manager/types";
import { useState } from "react";

/**
 * Creates a field, with its boundary when one is given, then reloads the fields
 * list so every screen showing it updates.
 */
export function useCreateField() {
  const authOptions = useAuthOptions();
  const { mutate: reloadFields } = useFields();
  const [isCreating, setIsCreating] = useState(false);

  async function createField(input: CreateFieldInput): Promise<Field> {
    if (!authOptions) {
      throw new Error("Not authenticated");
    }

    setIsCreating(true);
    try {
      const created = await unwrap(farmdbApi.POST(FIELDS_PATH, { ...authOptions, body: input }));
      await reloadFields();
      return toField(created);
    } finally {
      setIsCreating(false);
    }
  }

  return { createField, isCreating };
}
