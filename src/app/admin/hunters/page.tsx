import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireAdminProfile } from "@/lib/current-profile";
import { HuntersManager } from "@/components/admin/HuntersManager";
import styles from "../admin.module.css";

export const metadata: Metadata = {
  title: "Hunter Management — NEETLeveling Admin",
};

export default async function AdminHuntersPage() {
  await requireAdminProfile();

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
      <div className={styles.metricGrid}>
        <div className={`${styles.card} ${styles.metric}`} style={{ textAlign: "center" }}>
          <div className={styles.metricVal}>{hunters.length}</div>
          <div className={styles.metricLbl}>Total Hunters</div>
        </div>
        <div className={`${styles.card} ${styles.metric}`} style={{ textAlign: "center" }}>
          <div className={styles.metricVal}>{activeCount}</div>
          <div className={styles.metricLbl}>Active</div>
        </div>
        <div className={`${styles.card} ${styles.metric}`} style={{ textAlign: "center" }}>
          <div className={styles.metricVal}>{lockedCount}</div>
          <div className={styles.metricLbl}>Currently locked</div>
        </div>
        <div className={`${styles.card} ${styles.metric}`} style={{ textAlign: "center" }}>
          <div className={styles.metricVal}>{avgStreak}</div>
          <div className={styles.metricLbl}>Avg streak (days)</div>
        </div>
      </div>

      <HuntersManager hunters={hunters} />
    </>
  );
}
