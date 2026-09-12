import { getTodaysQuests } from "@/lib/todays-quest";
import { getPersonalQuests } from "@/lib/personal-quests";
import { applyPracticeOverrides } from "@/lib/progressive-overload";

export type OpenQuest = {
  id: string;
  title: string;
  durationMinutes: number;
  kind: "SYSTEM" | "PERSONAL";
};

// Everything still incomplete today that can actually cause a lockout —
// admin-assigned quests plus mandatory/daily personal quests (see
// checkAndApplyLockout in lib/lockout.ts, which the same two sources feed).
// Optional personal quests and non-daily ones never appear here since
// missing them carries no consequence.
export async function getOpenMandatoryQuests(
  profileId: string,
  level: number,
  streak: number,
): Promise<OpenQuest[]> {
  const [systemQuests, personalQuests] = await Promise.all([
    getTodaysQuests(profileId, level),
    getPersonalQuests(profileId),
  ]);

  const openSystem: OpenQuest[] = systemQuests
    .filter((q) => q.completions.length === 0)
    .map((q) => applyPracticeOverrides(q, streak))
    .map((q) => ({ id: q.id, title: q.title, durationMinutes: q.durationMinutes, kind: "SYSTEM" }));

  const openPersonal: OpenQuest[] = personalQuests
    .filter((q) => q.mandatory && q.frequency === "DAILY" && !q.done)
    .map((q) => ({ id: q.id, title: q.title, durationMinutes: q.durationMinutes, kind: "PERSONAL" }));

  return [...openSystem, ...openPersonal];
}
