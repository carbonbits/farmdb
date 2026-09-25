import type { components } from "@farmdb/api-client/generated/api";

// API shapes come from the generated schema. The interfaces below them are
// client-side shapes the schema does not describe.
type Schemas = components["schemas"];

export type UserRoleRef = Schemas["UserRoleRef"];
export type User = Schemas["UserMe"];
export type TokenResponse = Schemas["TokenResponse"];
export type PasskeyInfo = Schemas["PasskeyInfo"];
export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}
export type RegisterRequest = Schemas["RegisterRequest"];
export type LoginRequest = Schemas["LoginPasswordRequest"];
// The WebAuthn options inside the passkey responses. The schema types them as
// an open object, so the client narrows them to the shape the browser needs.
export interface PasskeyAuthOptions {
  challenge: string;
  timeout: number;
  rpId: string;
  userVerification: string;
  allowCredentials?: Array<{
    type: string;
    id: string;
    transports?: string[];
  }>;
  _challenge_key: string;
}
export interface PasskeyRegOptions {
  challenge: string;
  rp: { id: string; name: string };
  user: { id: string; name: string; displayName: string };
  pubKeyCredParams: Array<{ type: string; alg: number }>;
  timeout: number;
  excludeCredentials: Array<{ type: string; id: string }>;
  authenticatorSelection: {
    residentKey: string;
    userVerification: string;
  };
  attestation: string;
}
export interface ApiError {
  detail: string;
}
export type AuthzPermission = Schemas["PermissionOut"];
export type AuthzRoleSummary = Schemas["RoleSummary"];
export type AuthzRoleMember = Schemas["RoleMember"];
export type AuthzRoleDetail = Schemas["RoleDetail"];
export type AuthzUserRoleRef = Schemas["UserRoleRef"];
export type AuthzUserWithRoles = Schemas["UserWithRoles"];
export type CreateRoleInput = Schemas["CreateRoleRequest"];
