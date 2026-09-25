"use client";

import { farmdbMutate, useAuth } from "@farmdb/api-client";
import { FIELDS_PATH } from "@farmdb/field-manager/manager/_data/endpoints/fields";
import { useFields } from "@farmdb/field-manager/manager/_data/fetchers/use-fields";
import type { CreateFieldInput, Field } from "@farmdb/field-manager/types";
import { useState } from "react";

/**
 * Creates a field, with its boundary when one is given, then reloads the fields
 * list so every screen showing it updates.
 */
export function useCreateField() {
  const { accessToken } = useAuth();
  const { mutate: reloadFields } = useFields();
  const [isCreating, setIsCreating] = useState(false);

  async function createField(input: CreateFieldInput): Promise<Field> {
    if (!accessToken) {
      throw new Error("Not authenticated");
    }

    setIsCreating(true);
    try {
      const field = await farmdbMutate<Field, CreateFieldInput>(
        { path: FIELDS_PATH, method: "POST", body: input },
        accessToken,
      );
      await reloadFields();
      return field;
    } finally {
      setIsCreating(false);
    }
  }

  return { createField, isCreating };
}
