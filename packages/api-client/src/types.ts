export interface UserRoleRef {
  id: string;
  name: string;
  display_name: string | null;
}

export interface User {
  id: string;
  email: string;
  display_name: string | null;
  is_active: boolean;
  is_verified: boolean;
  // Populated by /v1/auth/me so the client can gate features.
  roles: UserRoleRef[];
  permissions: string[];
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface PasskeyInfo {
  id: string;
  friendly_name: string | null;
  device_type: string | null;
  backed_up: boolean;
  created_at: string;
  last_used_at: string | null;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  display_name?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

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


export interface AuthzPermission {
  name: string;
  group: string | null;
  description: string | null;
}

export interface AuthzRoleSummary {
  id: string;
  name: string;
  display_name: string | null;
  description: string | null;
  is_system: boolean;
  is_locked: boolean;
  permissions: string[];
  member_count: number;
}

export interface AuthzRoleMember {
  id: string;
  email: string;
  display_name: string | null;
}

export interface AuthzRoleDetail extends AuthzRoleSummary {
  members: AuthzRoleMember[];
}

export interface AuthzUserRoleRef {
  id: string;
  name: string;
  display_name: string | null;
}

export interface AuthzUserWithRoles {
  id: string;
  email: string;
  display_name: string | null;
  is_active: boolean;
  roles: AuthzUserRoleRef[];
}

export interface CreateRoleInput {
  name: string;
  display_name?: string;
  description?: string;
  permissions: string[];
}

// --- Geospatial features ---
export interface GeoJsonGeometry {
  type: string;
  coordinates: unknown;
}

export interface GeoFeature {
  type: "Feature";
  id: string;
  layer: string;
  season: string | null;
  geometry: GeoJsonGeometry;
  properties: Record<string, unknown>;
}

export interface GeoFeatureCollection {
  type: "FeatureCollection";
  features: GeoFeature[];
}
