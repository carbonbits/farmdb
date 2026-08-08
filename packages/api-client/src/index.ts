// Context and hooks

// API client
export { AuthApiError, authApi } from "./api";
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
  LoginRequest,
  PasskeyAuthOptions,
  PasskeyInfo,
  PasskeyRegOptions,
  RegisterRequest,
  TokenResponse,
  User,
} from "./types";
