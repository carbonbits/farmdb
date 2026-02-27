"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { authApi, AuthApiError } from "./api";
import type { AuthState, User, TokenResponse, PasskeyInfo } from "./types";

const TOKEN_STORAGE_KEY = "farmdb_refresh_token";

interface AuthContextType extends AuthState {
  // Auth actions
  register: (
    email: string,
    password: string,
    displayName?: string
  ) => Promise<void>;
  loginWithPassword: (email: string, password: string) => Promise<void>;
  loginWithPasskey: (email?: string) => Promise<void>;
  logout: () => Promise<void>;

  // Passkey management
  addPasskey: (friendlyName?: string) => Promise<PasskeyInfo>;
  listPasskeys: () => Promise<PasskeyInfo[]>;
  removePasskey: (passkeyId: string) => Promise<void>;

  // Utilities
  isPasskeySupported: boolean;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    accessToken: null,
    refreshToken: null,
    isLoading: true,
    isAuthenticated: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [isPasskeySupported, setIsPasskeySupported] = useState(false);

  // Check WebAuthn support on mount (lazy import to avoid SSR issues)
  useEffect(() => {
    import("./passkeys").then(({ isWebAuthnSupported }) => {
      setIsPasskeySupported(isWebAuthnSupported());
    });
  }, []);

  // Try to restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      // Check if we're in the browser
      if (typeof window === "undefined") {
        setState((s) => ({ ...s, isLoading: false }));
        return;
      }

      const storedRefreshToken = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (!storedRefreshToken) {
        setState((s) => ({ ...s, isLoading: false }));
        return;
      }

      try {
        const tokens = await authApi.refreshToken(storedRefreshToken);
        await handleTokens(tokens);
      } catch {
        // Invalid refresh token, clear storage
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        setState((s) => ({ ...s, isLoading: false }));
      }
    };

    restoreSession();
  }, []);

  // Handle successful authentication
  const handleTokens = useCallback(async (tokens: TokenResponse) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, tokens.refresh_token);

    try {
      const user = await authApi.getCurrentUser(tokens.access_token);
      setState({
        user,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        isLoading: false,
        isAuthenticated: true,
      });
    } catch {
      setState((s) => ({ ...s, isLoading: false }));
    }
  }, []);

  // Set up token refresh
  useEffect(() => {
    if (!state.accessToken) return;

    // Refresh token 1 minute before expiry (assuming 15 min access token)
    const refreshInterval = setInterval(
      async () => {
        if (state.refreshToken) {
          try {
            const tokens = await authApi.refreshToken(state.refreshToken);
            await handleTokens(tokens);
          } catch {
            // Refresh failed, log out
            await logout();
          }
        }
      },
      14 * 60 * 1000
    ); // 14 minutes

    return () => clearInterval(refreshInterval);
  }, [state.accessToken, state.refreshToken, handleTokens]);

  const register = useCallback(
    async (email: string, password: string, displayName?: string) => {
      setError(null);
      setState((s) => ({ ...s, isLoading: true }));

      try {
        const tokens = await authApi.register({
          email,
          password,
          display_name: displayName,
        });
        await handleTokens(tokens);
      } catch (err) {
        setState((s) => ({ ...s, isLoading: false }));
        const message =
          err instanceof AuthApiError ? err.message : "Registration failed";
        setError(message);
        throw err;
      }
    },
    [handleTokens]
  );

  const loginWithPassword = useCallback(
    async (email: string, password: string) => {
      setError(null);
      setState((s) => ({ ...s, isLoading: true }));

      try {
        const tokens = await authApi.loginPassword({ email, password });
        await handleTokens(tokens);
      } catch (err) {
        setState((s) => ({ ...s, isLoading: false }));
        const message =
          err instanceof AuthApiError ? err.message : "Login failed";
        setError(message);
        throw err;
      }
    },
    [handleTokens]
  );

  const loginWithPasskey = useCallback(
    async (email?: string) => {
      setError(null);
      setState((s) => ({ ...s, isLoading: true }));

      try {
        // Lazy import passkeys module
        const { authenticateWithPasskey } = await import("./passkeys");
        const tokens = await authenticateWithPasskey(email);
        await handleTokens(tokens);
      } catch (err) {
        setState((s) => ({ ...s, isLoading: false }));

        // Don't show error if user cancelled
        if ((err as Error).name === "NotAllowedError") {
          return;
        }

        const message =
          err instanceof AuthApiError
            ? err.message
            : "Passkey authentication failed";
        setError(message);
        throw err;
      }
    },
    [handleTokens]
  );

  const logout = useCallback(async () => {
    if (state.refreshToken) {
      try {
        await authApi.logout(state.refreshToken);
      } catch {
        // Ignore logout errors
      }
    }

    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      isAuthenticated: false,
    });
  }, [state.refreshToken]);

  const addPasskey = useCallback(
    async (friendlyName?: string): Promise<PasskeyInfo> => {
      if (!state.accessToken) {
        throw new Error("Not authenticated");
      }

      setError(null);
      try {
        // Lazy import passkeys module
        const { registerPasskey } = await import("./passkeys");
        return await registerPasskey(state.accessToken, friendlyName);
      } catch (err) {
        // Don't show error if user cancelled
        if ((err as Error).name === "NotAllowedError") {
          throw err;
        }

        const message =
          err instanceof AuthApiError
            ? err.message
            : "Failed to register passkey";
        setError(message);
        throw err;
      }
    },
    [state.accessToken]
  );

  const listPasskeys = useCallback(async (): Promise<PasskeyInfo[]> => {
    if (!state.accessToken) {
      throw new Error("Not authenticated");
    }

    const { passkeys } = await authApi.listPasskeys(state.accessToken);
    return passkeys;
  }, [state.accessToken]);

  const removePasskey = useCallback(
    async (passkeyId: string): Promise<void> => {
      if (!state.accessToken) {
        throw new Error("Not authenticated");
      }

      setError(null);
      try {
        await authApi.deletePasskey(state.accessToken, passkeyId);
      } catch (err) {
        const message =
          err instanceof AuthApiError ? err.message : "Failed to delete passkey";
        setError(message);
        throw err;
      }
    },
    [state.accessToken]
  );

  const clearError = useCallback(() => setError(null), []);

  const value: AuthContextType = {
    ...state,
    register,
    loginWithPassword,
    loginWithPasskey,
    logout,
    addPasskey,
    listPasskeys,
    removePasskey,
    isPasskeySupported,
    error,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
