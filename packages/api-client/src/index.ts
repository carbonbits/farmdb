// Context and hooks

// API client
export { AuthApiError, authApi } from "./api";
export { authzApi } from "./authz";
export { AuthProvider, useAuth } from "./context";
export { geoApi } from "./geo";
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
  ApiError,
  AuthState,
  AuthzPermission,
  AuthzRoleDetail,
  AuthzRoleMember,
  AuthzRoleSummary,
  AuthzUserRoleRef,
  AuthzUserWithRoles,
  CreateRoleInput,
  GeoFeature,
  GeoFeatureCollection,
  GeoJsonGeometry,
  LoginRequest,
  PasskeyAuthOptions,
  PasskeyInfo,
  PasskeyRegOptions,
  RegisterRequest,
  TokenResponse,
  User,
  UserRoleRef,
} from "./types";
