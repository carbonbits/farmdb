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
