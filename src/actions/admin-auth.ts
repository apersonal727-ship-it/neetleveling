"use server";

import { redirect } from "next/navigation";
import { checkAdminPassword, setAdminSessionCookie, clearAdminSessionCookie } from "@/lib/admin-auth";

export async function adminLogin(formData: FormData): Promise<{ error: string } | undefined> {
  const password = String(formData.get("password") ?? "");

  if (!password || !checkAdminPassword(password)) {
    return { error: "Incorrect password." };
  }

  await setAdminSessionCookie();
  redirect("/admin/quests");
}

export async function adminLogout(): Promise<void> {
  await clearAdminSessionCookie();
  redirect("/admin/login");
}
