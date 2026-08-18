import { prisma } from "@/lib/prisma";
import { questDayStart } from "@/lib/quest-day";

// Lazily re-deploys active QuestTemplates as fresh, ALL-hunters Quest rows
// once per day — same no-cron pattern as checkAndApplyLockout and streak
// crediting. Called from getCurrentProfile() on every request; the query
// is a fast no-op once today's batch is already deployed.
export async function ensureDailyQuestsDeployed() {
  const todayStart = questDayStart();

  const due = await prisma.questTemplate.findMany({
    where: {
      active: true,
      OR: [{ lastDeployedAt: null }, { lastDeployedAt: { lt: todayStart } }],
    },
  });

  if (due.length === 0) return;

  await prisma.$transaction([
    ...due.map((t) =>
      prisma.quest.create({
        data: {
          title: t.title,
          subject: t.subject,
          durationMinutes: t.durationMinutes,
          xpOverride: t.xpOverride,
          assignScope: "ALL",
          createdById: t.createdById,
        },
      }),
    ),
    ...due.map((t) =>
      prisma.questTemplate.update({ where: { id: t.id }, data: { lastDeployedAt: new Date() } }),
    ),
  ]);
}
