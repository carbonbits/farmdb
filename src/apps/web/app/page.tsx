"use client";

import { useAuth } from "@farmdb/api-client";
import Image from "next/image";
import Link from "next/link";
import { SignInScreen } from "./_components/sign-in-screen";

export default function Home() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-400">Loading...</div>
    );
  }

  if (!isAuthenticated) {
    return <SignInScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm max-h-16">
        <div className="max-w-7xl mx-auto px-4 py-1 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1>
            <Link href="/" className="flex items-center" aria-label="FarmDB home">
              <Image
                src="https://cdn.farmdb.uk/farmdb-rectangle-1-brown-text.png"
                alt="FarmDB"
                width={160}
                height={40}
                className="h-10 w-auto"
                priority
              />
            </Link>
          </h1>
          <nav className="flex gap-4">
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
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Welcome to FarmDB</h2>
          <p className="text-xl text-gray-600 mb-8">Professional farm management tooling</p>

          {user && (
            <div className="bg-white rounded-lg shadow p-6 max-w-md mx-auto">
              <p className="text-gray-600">Logged in as</p>
              <p className="text-lg font-medium text-gray-900">{user.email}</p>
              {user.display_name && <p className="text-gray-500">{user.display_name}</p>}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
