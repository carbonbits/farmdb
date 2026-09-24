"use client";

import { useAuth } from "@farmdb/api-client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { SignInScreen } from "../../_components/sign-in-screen";

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  return <SignInScreen />;
}
