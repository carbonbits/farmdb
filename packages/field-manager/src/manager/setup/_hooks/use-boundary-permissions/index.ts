"use client";

import { useAuth } from "@farmdb/api-client";
import {
  BOUNDARY_DELETE_PERMISSION,
  BOUNDARY_EDIT_PERMISSION,
} from "@farmdb/field-manager/manager/setup/_config";

/**
 * Whether the signed-in user may trace a boundary and remove a saved one. This
 * only decides which controls show; the server refuses anything not allowed.
 */
export function useBoundaryPermissions() {
  const { hasPermission } = useAuth();
  return {
    canTrace: hasPermission(BOUNDARY_EDIT_PERMISSION),
    canRemove: hasPermission(BOUNDARY_DELETE_PERMISSION),
  };
}
