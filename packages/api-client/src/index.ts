export type { components, paths } from "@farmdb/api-client/generated/api";

// Context and hooks
// API client

// Data
export { farmdbApi } from "@farmdb/api-client/data/client";
export { type AuthOptions, useAuthOptions } from "@farmdb/api-client/data/client/auth-options";
export { ApiError, type ApiResult, unwrap } from "@farmdb/api-client/data/client/errors";
export { FarmdbDataConfig } from "@farmdb/api-client/data/config/farmdb-data-config";
export { useFarmdbApi } from "@farmdb/api-client/data/fetchers/use-farmdb-api";
export { authApi } from "./api";
export { authzApi } from "./authz";
export { AuthProvider, useAuth } from "./context";
// Passkey utilities
export {
  authenticateWithPasskey,
  isAutofillSupported,
  isPlatformAuthenticatorAvailable,
  isWebAuthnSupported,
  registerPasskey,
  startConditionalAuth,
} from "./passkeys";
export type { LoginFormValues, RegisterFormValues } from "./schemas";
// Validation
export { emailSchema, loginSchema, passwordSchema, registerSchema } from "./schemas";
// Types
export type {
  AuthState,
  AuthzPermission,
  AuthzRoleDetail,
  AuthzRoleMember,
  AuthzRoleSummary,
  AuthzUserRoleRef,
  AuthzUserWithRoles,
  CreateRoleInput,
  LoginRequest,
  PasskeyAuthOptions,
  PasskeyInfo,
  PasskeyRegOptions,
  RegisterRequest,
  TokenResponse,
  User,
  UserRoleRef,
} from "./types";
