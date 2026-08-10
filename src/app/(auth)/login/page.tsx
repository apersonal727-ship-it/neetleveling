import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/AuthCard";

export const metadata: Metadata = {
  title: "Log In — NEETLeveling",
};

export default function LoginPage() {
  return <AuthCard initialMode="login" />;
}
