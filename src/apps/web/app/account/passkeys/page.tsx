"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth, type PasskeyInfo } from "@/lib/auth";

export default function PasskeysPage() {
  const router = useRouter();
  const {
    isAuthenticated,
    isLoading: authLoading,
    isPasskeySupported,
    addPasskey,
    listPasskeys,
    removePasskey,
    error,
    clearError,
  } = useAuth();

  const [passkeys, setPasskeys] = useState<PasskeyInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [friendlyName, setFriendlyName] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  // Redirect if not authenticated (only after auth state is loaded)
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // Load passkeys
  const loadPasskeys = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    try {
      const list = await listPasskeys();
      setPasskeys(list);
    } catch {
      // Error handled by context
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, listPasskeys]);

  useEffect(() => {
    if (isAuthenticated) {
      loadPasskeys();
    }
  }, [isAuthenticated, loadPasskeys]);

  const handleAddPasskey = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setIsAdding(true);

    try {
      await addPasskey(friendlyName || undefined);
      setFriendlyName("");
      setShowAddForm(false);
      await loadPasskeys();
    } catch (err) {
      // Don't close form if user cancelled
      if ((err as Error).name !== "NotAllowedError") {
        // Error handled by context
      }
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeletePasskey = async (passkeyId: string) => {
    if (!confirm("Are you sure you want to delete this passkey?")) {
      return;
    }

    clearError();
    setDeletingId(passkeyId);

    try {
      await removePasskey(passkeyId);
      await loadPasskeys();
    } catch {
      // Error handled by context
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Show loading while checking auth state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  // Show redirect message if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Redirecting to login...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Passkeys</h1>
          <p className="mt-2 text-gray-600">
            Manage your passkeys for passwordless login. Passkeys use biometrics
            like Face ID or Touch ID, or a security key.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {!isPasskeySupported && (
          <div className="mb-6 rounded-md bg-yellow-50 p-4">
            <div className="text-sm text-yellow-700">
              Your browser does not support passkeys. Try using a modern browser
              like Chrome, Safari, or Edge.
            </div>
          </div>
        )}

        {/* Add Passkey Section */}
        {isPasskeySupported && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            {!showAddForm ? (
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2 text-green-600 hover:text-green-700 font-medium"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add a passkey
              </button>
            ) : (
              <form onSubmit={handleAddPasskey} className="space-y-4">
                <div>
                  <label
                    htmlFor="friendlyName"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Passkey name (optional)
                  </label>
                  <input
                    id="friendlyName"
                    type="text"
                    value={friendlyName}
                    onChange={(e) => setFriendlyName(e.target.value)}
                    placeholder="e.g., MacBook Pro, iPhone"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Give your passkey a name to help identify which device it
                    belongs to.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={isAdding}
                    className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                  >
                    {isAdding ? "Registering..." : "Register passkey"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setFriendlyName("");
                      clearError();
                    }}
                    className="px-4 py-2 text-gray-700 text-sm font-medium rounded-md border border-gray-300 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Passkey List */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Your passkeys</h2>
          </div>

          {isLoading ? (
            <div className="px-6 py-12 text-center text-gray-500">
              Loading passkeys...
            </div>
          ) : passkeys.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"
                />
              </svg>
              <p className="mt-2">No passkeys registered yet.</p>
              <p className="text-sm">
                Add a passkey to enable passwordless login.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {passkeys.map((passkey) => (
                <li
                  key={passkey.id}
                  className="px-6 py-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                        <svg
                          className="h-5 w-5 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"
                          />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {passkey.friendly_name || "Passkey"}
                      </p>
                      <div className="flex gap-4 text-xs text-gray-500">
                        <span>Created {formatDate(passkey.created_at)}</span>
                        {passkey.last_used_at && (
                          <span>
                            Last used {formatDate(passkey.last_used_at)}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2 mt-1">
                        {passkey.device_type && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                            {passkey.device_type}
                          </span>
                        )}
                        {passkey.backed_up && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-600">
                            Synced
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeletePasskey(passkey.id)}
                    disabled={deletingId === passkey.id}
                    className="text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-50"
                  >
                    {deletingId === passkey.id ? "Deleting..." : "Delete"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
