import { bearerHeader, farmdbApi } from "@farmdb/api-client/data/client";
import { unwrap } from "@farmdb/api-client/data/client/errors";
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
  listPermissions(accessToken: string): Promise<AuthzPermission[]> {
    return unwrap(farmdbApi.GET("/v1/authz/permissions", { headers: bearerHeader(accessToken) }));
  },

  listRoles(accessToken: string): Promise<AuthzRoleSummary[]> {
    return unwrap(farmdbApi.GET("/v1/authz/roles", { headers: bearerHeader(accessToken) }));
  },

  getRole(accessToken: string, roleId: string): Promise<AuthzRoleDetail> {
    return unwrap(
      farmdbApi.GET("/v1/authz/roles/{role_id}", {
        headers: bearerHeader(accessToken),
        params: { path: { role_id: roleId } },
      }),
    );
  },

  createRole(accessToken: string, input: CreateRoleInput): Promise<AuthzRoleDetail> {
    return unwrap(
      farmdbApi.POST("/v1/authz/roles", { headers: bearerHeader(accessToken), body: input }),
    );
  },

  setRolePermissions(
    accessToken: string,
    roleId: string,
    permissions: string[],
  ): Promise<AuthzRoleDetail> {
    return unwrap(
      farmdbApi.PUT("/v1/authz/roles/{role_id}/permissions", {
        headers: bearerHeader(accessToken),
        params: { path: { role_id: roleId } },
        body: { permissions },
      }),
    );
  },

  listUsers(accessToken: string): Promise<AuthzUserWithRoles[]> {
    return unwrap(farmdbApi.GET("/v1/authz/users", { headers: bearerHeader(accessToken) }));
  },

  async assignRole(accessToken: string, userId: string, roleId: string): Promise<void> {
    await unwrap(
      farmdbApi.POST("/v1/authz/users/{user_id}/roles/{role_id}", {
        headers: bearerHeader(accessToken),
        params: { path: { user_id: userId, role_id: roleId } },
      }),
    );
  },

  async revokeRole(accessToken: string, userId: string, roleId: string): Promise<void> {
    await unwrap(
      farmdbApi.DELETE("/v1/authz/users/{user_id}/roles/{role_id}", {
        headers: bearerHeader(accessToken),
        params: { path: { user_id: userId, role_id: roleId } },
      }),
    );
  },
};
