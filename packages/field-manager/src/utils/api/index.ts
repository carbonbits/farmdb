import { API_BASE, authHeaders, handleResponse } from "./api";
import type { CreateFieldInput, Field } from "./types";

/**
 * Fields API (/v1/fields). Authenticated with the caller's access token.
 * Creating a field records the field and its boundary in one call and requires
 * the fields.edit permission server-side.
 */
export const fieldsApi = {
  async create(accessToken: string, input: CreateFieldInput): Promise<Field> {
      const response = await fetch(`${API_BASE}/v1/fields/`, {
      method: "POST",
      headers: authHeaders(accessToken),
      body: JSON.stringify(input),
    });
    return handleResponse<Field>(response);
  },
};
