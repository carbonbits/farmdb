// Context and hooks
export { AuthProvider, useAuth } from "./context";

// API client
export { authApi, AuthApiError } from "./api";

// Passkey utilities
export {
  registerPasskey,
  authenticateWithPasskey,
  startConditionalAuth,
  isWebAuthnSupported,
  isAutofillSupported,
  isPlatformAuthenticatorAvailable,
} from "./passkeys";

// Types
export type {
  User,
  TokenResponse,
  PasskeyInfo,
  AuthState,
  RegisterRequest,
  LoginRequest,
  PasskeyAuthOptions,
  PasskeyRegOptions,
  ApiError,
} from "./types";
