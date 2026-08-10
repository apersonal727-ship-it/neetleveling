import type { Metadata } from "next";
import { getCurrentProfile } from "@/lib/current-profile";
import { SettingsForm } from "@/components/settings/SettingsForm";

export const metadata: Metadata = {
  title: "Settings — NEETLeveling",
};

export default async function SettingsPage() {
  const profile = await getCurrentProfile();
  return <SettingsForm profile={profile} />;
}
