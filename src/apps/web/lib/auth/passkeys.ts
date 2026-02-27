import {
  startAuthentication,
  startRegistration,
  browserSupportsWebAuthn,
  browserSupportsWebAuthnAutofill,
  platformAuthenticatorIsAvailable,
} from "@simplewebauthn/browser";
import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from "@simplewebauthn/browser";

import { authApi } from "./api";
import type { PasskeyAuthOptions, PasskeyRegOptions, TokenResponse, PasskeyInfo } from "./types";

/**
 * Check if WebAuthn is supported in the current browser
 */
export function isWebAuthnSupported(): boolean {
  return browserSupportsWebAuthn();
}

/**
 * Check if WebAuthn autofill (conditional UI) is supported
 */
export async function isAutofillSupported(): Promise<boolean> {
  return browserSupportsWebAuthnAutofill();
}

/**
 * Check if platform authenticator (Touch ID, Face ID, Windows Hello) is available
 */
export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  return platformAuthenticatorIsAvailable();
}

/**
 * Convert server options to SimpleWebAuthn format for registration
 */
function toRegistrationOptions(
  options: PasskeyRegOptions
): PublicKeyCredentialCreationOptionsJSON {
  return {
    challenge: options.challenge,
    rp: options.rp,
    user: {
      id: options.user.id,
      name: options.user.name,
      displayName: options.user.displayName,
    },
    pubKeyCredParams: options.pubKeyCredParams.map((p) => ({
      type: p.type as "public-key",
      alg: p.alg,
    })),
    timeout: options.timeout,
    excludeCredentials: options.excludeCredentials.map((c) => ({
      type: c.type as "public-key",
      id: c.id,
    })),
    authenticatorSelection: {
      residentKey: options.authenticatorSelection
        .residentKey as ResidentKeyRequirement,
      userVerification: options.authenticatorSelection
        .userVerification as UserVerificationRequirement,
    },
    attestation: options.attestation as AttestationConveyancePreference,
  };
}

/**
 * Convert server options to SimpleWebAuthn format for authentication
 */
function toAuthenticationOptions(
  options: PasskeyAuthOptions
): PublicKeyCredentialRequestOptionsJSON {
  return {
    challenge: options.challenge,
    timeout: options.timeout,
    rpId: options.rpId,
    userVerification:
      options.userVerification as UserVerificationRequirement,
    allowCredentials: options.allowCredentials?.map((c) => ({
      type: c.type as "public-key",
      id: c.id,
      transports: c.transports as AuthenticatorTransport[] | undefined,
    })),
  };
}

/**
 * Register a new passkey for the authenticated user
 *
 * @param accessToken - The user's access token
 * @param friendlyName - Optional friendly name for the passkey (e.g., "MacBook Pro")
 * @returns The registered passkey info
 *
 * @example
 * ```ts
 * try {
 *   const passkey = await registerPasskey(accessToken, "My MacBook");
 *   console.log("Passkey registered:", passkey.id);
 * } catch (error) {
 *   if (error.name === "NotAllowedError") {
 *     console.log("User cancelled the registration");
 *   }
 * }
 * ```
 */
export async function registerPasskey(
  accessToken: string,
  friendlyName?: string
): Promise<PasskeyInfo> {
  // 1. Get registration options from server
  const { options } = await authApi.getPasskeyRegisterOptions(accessToken);

  // 2. Start WebAuthn registration ceremony
  const credential: RegistrationResponseJSON = await startRegistration({
    optionsJSON: toRegistrationOptions(options),
  });

  // 3. Send credential to server for verification
  const passkey = await authApi.verifyPasskeyRegister(
    accessToken,
    credential as unknown as Record<string, unknown>,
    friendlyName
  );

  return passkey;
}

/**
 * Authenticate with a passkey
 *
 * @param email - Optional email to filter allowed credentials. If omitted, allows discoverable credentials.
 * @returns Token response with access and refresh tokens
 *
 * @example
 * ```ts
 * // With email (shows only passkeys for this user)
 * const tokens = await authenticateWithPasskey("user@example.com");
 *
 * // Without email (discoverable credentials / resident keys)
 * const tokens = await authenticateWithPasskey();
 * ```
 */
export async function authenticateWithPasskey(
  email?: string
): Promise<TokenResponse> {
  // 1. Get authentication options from server
  const { options } = await authApi.getPasskeyLoginOptions(email);

  // 2. Start WebAuthn authentication ceremony
  const credential: AuthenticationResponseJSON = await startAuthentication({
    optionsJSON: toAuthenticationOptions(options),
  });

  // 3. Send credential to server for verification (include challenge key)
  const credentialWithKey = {
    ...credential,
    _challenge_key: options._challenge_key,
  };

  const tokens = await authApi.verifyPasskeyLogin(
    credentialWithKey as unknown as Record<string, unknown>
  );

  return tokens;
}

/**
 * Start conditional UI (autofill) authentication
 * This allows passkey suggestions in the browser's autofill dropdown
 *
 * @param onSuccess - Callback when authentication succeeds
 * @param onError - Callback when authentication fails
 * @returns AbortController to cancel the operation
 *
 * @example
 * ```ts
 * useEffect(() => {
 *   const controller = startConditionalAuth(
 *     (tokens) => {
 *       // User authenticated via autofill
 *       setTokens(tokens);
 *     },
 *     (error) => console.error(error)
 *   );
 *
 *   return () => controller?.abort();
 * }, []);
 * ```
 */
export async function startConditionalAuth(
  onSuccess: (tokens: TokenResponse) => void,
  onError: (error: Error) => void
): Promise<AbortController | null> {
  if (!(await isAutofillSupported())) {
    return null;
  }

  const abortController = new AbortController();

  try {
    // Get options without email for discoverable credentials
    const { options } = await authApi.getPasskeyLoginOptions();

    const credential = await startAuthentication({
      optionsJSON: toAuthenticationOptions(options),
      useBrowserAutofill: true,
    });

    const credentialWithKey = {
      ...credential,
      _challenge_key: options._challenge_key,
    };

    const tokens = await authApi.verifyPasskeyLogin(
      credentialWithKey as unknown as Record<string, unknown>
    );

    onSuccess(tokens);
  } catch (error) {
    if ((error as Error).name !== "AbortError") {
      onError(error as Error);
    }
  }

  return abortController;
}

// Type helpers for WebAuthn options
type ResidentKeyRequirement = "discouraged" | "preferred" | "required";
type UserVerificationRequirement = "discouraged" | "preferred" | "required";
type AttestationConveyancePreference = "none" | "indirect" | "direct" | "enterprise";
type AuthenticatorTransport = "usb" | "nfc" | "ble" | "internal" | "hybrid";
