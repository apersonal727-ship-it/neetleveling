import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { CharacterCreationWizard } from "@/components/onboarding/CharacterCreationWizard";

export default async function CharacterCreationPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await prisma.profile.findUnique({ where: { authUserId: user.id } });

  return (
    <CharacterCreationWizard
      initialName={profile?.name ?? ""}
      initialClass={profile?.hunterClass ?? "Scholar"}
      needsName={!profile}
    />
  );
}
