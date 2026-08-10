"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { generateHunterId, generateReferralCode } from "@/lib/hunter-id";

export type AuthResult = { error: string } | { success: true };

export async function signIn(formData: FormData): Promise<AuthResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Incorrect email or password." };
  }

  // Logging back in cancels a pending account-deletion grace period.
  if (data.user) {
    await prisma.profile.updateMany({
      where: { authUserId: data.user.id, deletionScheduledFor: { not: null } },
      data: { deletionScheduledFor: null },
    });
  }

  redirect("/dashboard");
}

export async function signUp(formData: FormData): Promise<AuthResult> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!name) return { error: "Pick a Hunter Name." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Enter a valid email address." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    if (error.message.toLowerCase().includes("already registered")) {
      return { error: "An account with this email already exists." };
    }
    return { error: error.message };
  }

  if (!data.user) {
    return { error: "Something went wrong creating your account." };
  }

  const [hunterId, referralCode] = await Promise.all([
    generateHunterId(),
    generateReferralCode(),
  ]);

  await prisma.profile.create({
    data: {
      authUserId: data.user.id,
      email,
      name,
      hunterId,
      referralCode,
    },
  });

  redirect("/character-creation");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function requestPasswordReset(formData: FormData): Promise<AuthResult> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Enter your email." };

  const supabase = await createClient();
  // Always report success regardless of whether the account exists, so this
  // endpoint can't be used to enumerate registered emails.
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/change-password`,
  });

  return { success: true };
}

export async function updatePassword(formData: FormData): Promise<AuthResult> {
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!currentPassword) {
    return { error: "Enter your current password." };
  }
  if (newPassword.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (!/\d/.test(newPassword)) {
    return { error: "Password must contain a number." };
  }
  if (newPassword !== confirmPassword) {
    return { error: "Passwords don't match." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { error: "You need to be logged in to do this." };
  }

  // Re-verify identity with the current password before allowing the change
  // — updateUser() alone would accept any new password on an already-signed-in
  // session, which would make the "Current Password" field purely decorative.
  const { error: reauthError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  if (reauthError) {
    return { error: "Current password is incorrect." };
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { error: error.message };

  return { success: true };
}
