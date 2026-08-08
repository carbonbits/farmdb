"use client";

import { type LoginFormValues, loginSchema, useAuth } from "@farmdb/api-client";
import { EmailField, PasswordField } from "@farmdb/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";

function Feature({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-2.5 text-[13px] text-[#dbe8db]">
      <svg
        className="mt-0.5 h-[18px] w-[18px] flex-none text-[#8fbf95]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 3l8 3.5v5c0 4.5-3.2 8.2-8 9.5-4.8-1.3-8-5-8-9.5v-5z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
      <span>{children}</span>
    </li>
  );
}

function PasskeyIcon() {
  return (
    <svg
      className="h-[18px] w-[18px]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="9" cy="9" r="4" />
      <path d="M13 13l7 7M17 17l-2 2M19.5 15.5l-2 2" />
    </svg>
  );
}

export function SignInScreen() {
  const { loginWithPassword, loginWithPasskey, isPasskeySupported, error, clearError } = useAuth();
  const [isPasskeySubmitting, setIsPasskeySubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      await loginWithPassword(values.email, values.password);
    } catch {
      // Error is surfaced via context
    }
  };

  const handlePasskeyLogin = async () => {
    setIsPasskeySubmitting(true);

    try {
      await loginWithPasskey(getValues("email") || undefined);
    } catch {
      // Error is surfaced via context
    } finally {
      setIsPasskeySubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-[#fcf8f0] lg:grid-cols-[380px_1fr]">
      <aside
        className="hidden flex-col justify-between p-10 text-[#eef3ea] lg:flex"
        style={{ background: "linear-gradient(155deg,#22372c,#2c5a38 60%,#375f43)" }}
      >
        <Link href="/" aria-label="FarmDB home">
          <Image
            src="https://cdn.farmdb.uk/farmdb-rectangle-1-white-text.png"
            alt="FarmDB"
            width={160}
            height={40}
            className="h-9 w-auto"
          />
        </Link>

        <div>
          <h2 className="text-[27px] font-bold leading-tight text-white">Sign in to your farm.</h2>
          <p className="mt-3 text-sm text-[#bcd2bf]">
            Pick up where you left off — fields, crops, activities and your team, in one place.
          </p>
          <ul className="mt-5 flex flex-col gap-2.5">
            <Feature>Passkeys or a password — your choice</Feature>
            <Feature>One account for the web app and the API</Feature>
            <Feature>Built for day-to-day farm operations</Feature>
          </ul>
        </div>

        <p className="text-[11.5px] text-[#9db8a2]">Professional farm management tooling</p>
      </aside>

      <main className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <Link href="/" className="mb-8 flex lg:hidden" aria-label="FarmDB home">
            <Image
              src="https://cdn.farmdb.uk/farmdb-rectangle-1-brown-text.png"
              alt="FarmDB"
              width={160}
              height={40}
              className="h-9 w-auto"
            />
          </Link>

          <h1 className="text-[26px] font-bold text-[#20160f]">Sign in to FarmDB</h1>
          <p className="mt-2 text-sm text-[#75583f]">
            Use your email and password, or the passkey saved on this device.
          </p>

          {error && (
            <div className="mt-4 rounded-lg border border-[#eccfbe] bg-[#fbeee7] px-3 py-2.5 text-sm text-[#8a3f1e]">
              {error}
            </div>
          )}

          <form className="mt-4 flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            <EmailField
              autoComplete="email webauthn"
              error={errors.email?.message}
              {...register("email", { onChange: clearError })}
            />

            <PasswordField
              error={errors.password?.message}
              {...register("password", { onChange: clearError })}
            />

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-1 flex w-full items-center justify-center gap-2 rounded-md bg-[#346b41] py-3 text-[15px] font-semibold text-white hover:bg-[#2c5a38] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Signing in…" : "Continue"}
            </button>
          </form>

          {isPasskeySupported && (
            <button
              type="button"
              onClick={handlePasskeyLogin}
              disabled={isPasskeySubmitting}
              className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-md border border-[#eadfcb] bg-white py-3 text-[15px] font-semibold text-[#3f2d22] hover:bg-[#f4ead4] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <PasskeyIcon />
              Sign in with a passkey
            </button>
          )}

          <p className="mt-6 text-sm text-[#75583f]">
            New to FarmDB?{" "}
            <Link href="/register" className="font-semibold text-[#2c5a38] hover:text-[#346b41]">
              Create an account
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
