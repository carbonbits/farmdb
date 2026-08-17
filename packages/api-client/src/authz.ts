import { API_BASE, authHeaders, handleResponse } from "./api";
import type {
  AuthzPermission,
  AuthzRoleDetail,
  AuthzRoleSummary,
  AuthzUserWithRoles,
  CreateRoleInput,
} from "./types";

/**
 * Access-control admin API (/v1/authz). Every call is authenticated with the
 * caller's access token and requires the `roles.manage` permission server-side.
 */
export const authzApi = {
  async listPermissions(accessToken: string): Promise<AuthzPermission[]> {
    const response = await fetch(`${API_BASE}/v1/authz/permissions`, {
      headers: authHeaders(accessToken),
    });
    return handleResponse<AuthzPermission[]>(response);
  },

  async listRoles(accessToken: string): Promise<AuthzRoleSummary[]> {
    const response = await fetch(`${API_BASE}/v1/authz/roles`, {
      headers: authHeaders(accessToken),
    });
    return handleResponse<AuthzRoleSummary[]>(response);
  },

  async getRole(accessToken: string, roleId: string): Promise<AuthzRoleDetail> {
    const response = await fetch(`${API_BASE}/v1/authz/roles/${roleId}`, {
      headers: authHeaders(accessToken),
    });
    return handleResponse<AuthzRoleDetail>(response);
  },

  async createRole(accessToken: string, input: CreateRoleInput): Promise<AuthzRoleDetail> {
    const response = await fetch(`${API_BASE}/v1/authz/roles`, {
      method: "POST",
      headers: authHeaders(accessToken),
      body: JSON.stringify(input),
    });
    return handleResponse<AuthzRoleDetail>(response);
  },

  async setRolePermissions(
    accessToken: string,
    roleId: string,
    permissions: string[],
  ): Promise<AuthzRoleDetail> {
    const response = await fetch(`${API_BASE}/v1/authz/roles/${roleId}/permissions`, {
      method: "PUT",
      headers: authHeaders(accessToken),
      body: JSON.stringify({ permissions }),
    });
    return handleResponse<AuthzRoleDetail>(response);
  },

  async listUsers(accessToken: string): Promise<AuthzUserWithRoles[]> {
    const response = await fetch(`${API_BASE}/v1/authz/users`, {
      headers: authHeaders(accessToken),
    });
    return handleResponse<AuthzUserWithRoles[]>(response);
  },

  async assignRole(accessToken: string, userId: string, roleId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/v1/authz/users/${userId}/roles/${roleId}`, {
      method: "POST",
      headers: authHeaders(accessToken),
    });
    return handleResponse<void>(response);
  },

  async revokeRole(accessToken: string, userId: string, roleId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/v1/authz/users/${userId}/roles/${roleId}`, {
      method: "DELETE",
      headers: authHeaders(accessToken),
    });
    return handleResponse<void>(response);
  },
};
