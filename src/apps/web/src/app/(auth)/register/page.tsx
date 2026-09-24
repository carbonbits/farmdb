"use client";

import { type RegisterFormValues, registerSchema, useAuth } from "@farmdb/api-client";
import { EmailField, PasswordField, TextField } from "@farmdb/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser, isAuthenticated, error, clearError } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      await registerUser(values.email, values.password, values.displayName || undefined);
    } catch {
      // Error is surfaced via context
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fcf8f0] px-6 py-16">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex justify-center" aria-label="FarmDB home">
          <Image
            src="https://cdn.farmdb.uk/farmdb-rectangle-1-brown-text.png"
            alt="FarmDB"
            width={160}
            height={40}
            className="h-9 w-auto"
          />
        </Link>

        <h1 className="text-center text-[26px] font-bold text-[#20160f]">Create your account</h1>
        <p className="mt-2 text-center text-sm text-[#75583f]">
          One account covers every farm you manage.
        </p>

        {error && (
          <div className="mt-4 rounded-lg border border-[#eccfbe] bg-[#fbeee7] px-3 py-2.5 text-sm text-[#8a3f1e]">
            {error}
          </div>
        )}

        <form className="mt-4 flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <TextField
            label="Display name (optional)"
            placeholder="Amina Njoroge"
            autoComplete="name"
            {...register("displayName", { onChange: clearError })}
          />

          <EmailField
            error={errors.email?.message}
            {...register("email", { onChange: clearError })}
          />

          <PasswordField
            autoComplete="new-password"
            placeholder="At least 8 characters"
            error={errors.password?.message}
            {...register("password", { onChange: clearError })}
          />

          <PasswordField
            label="Confirm password"
            autoComplete="new-password"
            placeholder="Confirm your password"
            error={errors.confirmPassword?.message}
            {...register("confirmPassword", { onChange: clearError })}
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-1 flex w-full items-center justify-center gap-2 rounded-md bg-[#346b41] py-3 text-[15px] font-semibold text-white hover:bg-[#2c5a38] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#75583f]">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-[#2c5a38] hover:text-[#346b41]">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
