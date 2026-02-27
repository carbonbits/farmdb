import type {
  ApiError,
  LoginRequest,
  PasskeyAuthOptions,
  PasskeyInfo,
  PasskeyRegOptions,
  RegisterRequest,
  TokenResponse,
  User,
} from "./types";

// Empty string = relative URLs, requests go to the same origin serving the static files
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

class AuthApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "AuthApiError";
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      detail: "An unexpected error occurred",
    }));
    throw new AuthApiError(error.detail, response.status);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json();
}

function authHeaders(accessToken: string | null): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }
  return headers;
}

export const authApi = {
  // Registration
  async register(data: RegisterRequest): Promise<TokenResponse> {
    const response = await fetch(`${API_BASE}/v1/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse<TokenResponse>(response);
  },

  // Password login
  async loginPassword(data: LoginRequest): Promise<TokenResponse> {
    const response = await fetch(`${API_BASE}/v1/auth/login/password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse<TokenResponse>(response);
  },

  // Passkey login - get options
  async getPasskeyLoginOptions(
    email?: string
  ): Promise<{ options: PasskeyAuthOptions }> {
    const response = await fetch(`${API_BASE}/v1/auth/login/passkey/options`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email || null }),
    });
    return handleResponse<{ options: PasskeyAuthOptions }>(response);
  },

  // Passkey login - verify
  async verifyPasskeyLogin(
    credential: Record<string, unknown>
  ): Promise<TokenResponse> {
    const response = await fetch(`${API_BASE}/v1/auth/login/passkey/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential }),
    });
    return handleResponse<TokenResponse>(response);
  },

  // Passkey registration - get options (authenticated)
  async getPasskeyRegisterOptions(
    accessToken: string
  ): Promise<{ options: PasskeyRegOptions }> {
    const response = await fetch(
      `${API_BASE}/v1/auth/passkeys/register/options`,
      {
        method: "POST",
        headers: authHeaders(accessToken),
      }
    );
    return handleResponse<{ options: PasskeyRegOptions }>(response);
  },

  // Passkey registration - verify (authenticated)
  async verifyPasskeyRegister(
    accessToken: string,
    credential: Record<string, unknown>,
    friendlyName?: string
  ): Promise<PasskeyInfo> {
    const response = await fetch(
      `${API_BASE}/v1/auth/passkeys/register/verify`,
      {
        method: "POST",
        headers: authHeaders(accessToken),
        body: JSON.stringify({
          credential,
          friendly_name: friendlyName || null,
        }),
      }
    );
    return handleResponse<PasskeyInfo>(response);
  },

  // List passkeys (authenticated)
  async listPasskeys(
    accessToken: string
  ): Promise<{ passkeys: PasskeyInfo[] }> {
    const response = await fetch(`${API_BASE}/v1/auth/passkeys`, {
      method: "GET",
      headers: authHeaders(accessToken),
    });
    return handleResponse<{ passkeys: PasskeyInfo[] }>(response);
  },

  // Delete passkey (authenticated)
  async deletePasskey(accessToken: string, passkeyId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/v1/auth/passkeys/${passkeyId}`, {
      method: "DELETE",
      headers: authHeaders(accessToken),
    });
    return handleResponse<void>(response);
  },

  // Refresh token
  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    const response = await fetch(`${API_BASE}/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    return handleResponse<TokenResponse>(response);
  },

  // Logout
  async logout(refreshToken: string): Promise<void> {
    const response = await fetch(`${API_BASE}/v1/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    return handleResponse<void>(response);
  },

  // Get current user (authenticated)
  async getCurrentUser(accessToken: string): Promise<User> {
    const response = await fetch(`${API_BASE}/v1/auth/me`, {
      method: "GET",
      headers: authHeaders(accessToken),
    });
    return handleResponse<User>(response);
  },
};

export { AuthApiError };
