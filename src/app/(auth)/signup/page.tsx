import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/AuthCard";

export const metadata: Metadata = {
  title: "Sign Up — NEETLeveling",
};

export default function SignupPage() {
  return <AuthCard initialMode="signup" />;
}
