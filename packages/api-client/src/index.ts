// Context and hooks
// API client
export { AuthApiError, authApi } from "./api";
export { authzApi } from "./authz";
export { fieldsApi } from "./fields";
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
  ApiError,
  AuthState,
  AuthzPermission,
  AuthzRoleDetail,
  AuthzRoleMember,
  AuthzRoleSummary,
  AuthzUserRoleRef,
  AuthzUserWithRoles,
  CreateFieldInput,
  CreateRoleInput,
  Field,
  FieldGeometry,
  LoginRequest,
  PasskeyAuthOptions,
  PasskeyInfo,
  PasskeyRegOptions,
  RegisterRequest,
  TokenResponse,
  User,
  UserRoleRef,
} from "./types";
