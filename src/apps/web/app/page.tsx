"use client";

import Link from "next/link";
import { Logo } from "@/components/logo";
import { useAuth } from "@/lib/auth";

export default function Home() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm max-h-16">
        <div className="max-w-7xl mx-auto px-4 py-1 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1>
            <Link href="/" className="flex items-center gap-2.5" aria-label="FarmDB home">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-900 p-px shadow-sm ring-1 ring-black/5">
                <Logo className="h-full w-full" />
              </span>
              <span className="text-2xl font-extrabold tracking-tight text-gray-900">
                Farm<span className="text-[#E87914]">DB</span>
              </span>
            </Link>
          </h1>
          <nav className="flex gap-4">
            {isLoading ? (
              <span className="text-gray-400">Loading...</span>
            ) : isAuthenticated ? (
              <>
                <Link href="/account/passkeys" className="text-gray-600 hover:text-gray-900">
                  Passkeys
                </Link>
                <button
                  type="button"
                  onClick={() => logout()}
                  className="text-gray-600 hover:text-gray-900"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-gray-600 hover:text-gray-900">
                  Login
                </Link>
                <Link
                  href="/register"
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                  Register
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Welcome to FarmDB</h2>
          <p className="text-xl text-gray-600 mb-8">Professional farm management tooling</p>

          {isAuthenticated && user && (
            <div className="bg-white rounded-lg shadow p-6 max-w-md mx-auto">
              <p className="text-gray-600">Logged in as</p>
              <p className="text-lg font-medium text-gray-900">{user.email}</p>
              {user.display_name && <p className="text-gray-500">{user.display_name}</p>}
            </div>
          )}

          {!isAuthenticated && !isLoading && (
            <div className="flex gap-4 justify-center">
              <Link
                href="/register"
                className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 text-lg"
              >
                Get Started
              </Link>
              <Link
                href="/login"
                className="border border-gray-300 text-gray-700 px-6 py-3 rounded-md hover:bg-gray-50 text-lg"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
