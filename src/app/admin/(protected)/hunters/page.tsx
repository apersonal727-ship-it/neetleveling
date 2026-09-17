import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";
import { HuntersManager } from "@/components/admin/HuntersManager";
import styles from "../../admin.module.css";

export const metadata: Metadata = {
  title: "Hunter Management — NEETLeveling Admin",
};

export default async function AdminHuntersPage() {
  await requireAdminSession();

  const profiles = await prisma.profile.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      xp: true,
      streak: true,
      locked: true,
      walletCredit: true,
      _count: { select: { questCompletions: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  const hunters = profiles.map((p) => ({
    id: p.id,
    name: p.name,
    email: p.email,
    xp: p.xp,
    streak: p.streak,
    locked: p.locked,
    walletCredit: p.walletCredit,
    questCount: p._count.questCompletions,
  }));

  const activeCount = hunters.filter((h) => !h.locked).length;
  const lockedCount = hunters.filter((h) => h.locked).length;
  const avgStreak = hunters.length
    ? (hunters.reduce((sum, h) => sum + h.streak, 0) / hunters.length).toFixed(1)
    : "0.0";

  return (
    <>
      <div className={styles.topbar}>
        <div>
          <div className={styles.topbarTitle}>Hunters</div>
          <div className={styles.topbarSub}>{hunters.length.toLocaleString("en-IN")} registered · search and manage accounts</div>
        </div>
      </div>

      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={`${styles.statNum} ${styles.cyan}`}>{hunters.length}</div>
          <div className={styles.statLbl}>Total Hunters</div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statNum} ${styles.green}`}>{activeCount}</div>
          <div className={styles.statLbl}>Active</div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statNum} ${styles.danger}`}>{lockedCount}</div>
          <div className={styles.statLbl}>Locked</div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statNum} ${styles.gold}`}>{avgStreak}</div>
          <div className={styles.statLbl}>Avg Streak (Days)</div>
        </div>
      </div>

      <HuntersManager hunters={hunters} />
    </>
  );
}
