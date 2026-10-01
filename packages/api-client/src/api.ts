import { bearerHeader, farmdbApi } from "@farmdb/api-client/data/client";
import { unwrap } from "@farmdb/api-client/data/client/errors";
import type {
  LoginRequest,
  PasskeyAuthOptions,
  PasskeyInfo,
  PasskeyRegOptions,
  RegisterRequest,
  TokenResponse,
  User,
} from "./types";

export const authApi = {
  register(data: RegisterRequest): Promise<TokenResponse> {
    return unwrap(farmdbApi.POST("/v1/auth/register", { body: data }));
  },

  loginPassword(data: LoginRequest): Promise<TokenResponse> {
    return unwrap(farmdbApi.POST("/v1/auth/login/password", { body: data }));
  },

  /** The API types WebAuthn options as an open object; the browser needs this exact shape. */
  async getPasskeyLoginOptions(email?: string): Promise<{ options: PasskeyAuthOptions }> {
    const { options } = await unwrap(
      farmdbApi.POST("/v1/auth/login/passkey/options", { body: { email: email || null } }),
    );
    return { options: options as PasskeyAuthOptions };
  },

  verifyPasskeyLogin(credential: Record<string, unknown>): Promise<TokenResponse> {
    return unwrap(farmdbApi.POST("/v1/auth/login/passkey/verify", { body: { credential } }));
  },

  async getPasskeyRegisterOptions(accessToken: string): Promise<{ options: PasskeyRegOptions }> {
    const { options } = await unwrap(
      farmdbApi.POST("/v1/auth/passkeys/register/options", { headers: bearerHeader(accessToken) }),
    );
    return { options: options as PasskeyRegOptions };
  },

  verifyPasskeyRegister(
    accessToken: string,
    credential: Record<string, unknown>,
    friendlyName?: string,
  ): Promise<PasskeyInfo> {
    return unwrap(
      farmdbApi.POST("/v1/auth/passkeys/register/verify", {
        headers: bearerHeader(accessToken),
        body: { credential, friendly_name: friendlyName || null },
      }),
    );
  },

  listPasskeys(accessToken: string): Promise<{ passkeys: PasskeyInfo[] }> {
    return unwrap(farmdbApi.GET("/v1/auth/passkeys", { headers: bearerHeader(accessToken) }));
  },

  async deletePasskey(accessToken: string, passkeyId: string): Promise<void> {
    await unwrap(
      farmdbApi.DELETE("/v1/auth/passkeys/{passkey_id}", {
        headers: bearerHeader(accessToken),
        params: { path: { passkey_id: passkeyId } },
      }),
    );
  },

  refreshToken(refreshToken: string): Promise<TokenResponse> {
    return unwrap(farmdbApi.POST("/v1/auth/refresh", { body: { refresh_token: refreshToken } }));
  },

  async logout(refreshToken: string): Promise<void> {
    await unwrap(farmdbApi.POST("/v1/auth/logout", { body: { refresh_token: refreshToken } }));
  },

  getCurrentUser(accessToken: string): Promise<User> {
    return unwrap(farmdbApi.GET("/v1/auth/me", { headers: bearerHeader(accessToken) }));
  },
};
