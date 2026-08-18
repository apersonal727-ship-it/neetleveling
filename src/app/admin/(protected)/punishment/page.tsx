import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";
import { PunishmentPoolManager } from "@/components/admin/PunishmentPoolManager";
import styles from "../../admin.module.css";

export const metadata: Metadata = {
  title: "Punishment Pool — NEETLeveling Admin",
};

export default async function AdminPunishmentPage() {
  await requireAdminSession();

  const [pool, config, totalLockouts] = await Promise.all([
    prisma.punishmentQuest.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.punishmentConfig.findUnique({ where: { id: 1 } }),
    prisma.lockoutEvent.count(),
  ]);

  const totalTriggered = pool.reduce((sum, p) => sum + p.timesTriggered, 0);

  return (
    <>
      <section>
        <span className={styles.secLabel}>Overview</span>
        <div className={styles.metricGrid} style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
          <div className={`${styles.card} ${styles.metric}`} style={{ textAlign: "center" }}>
            <div className={styles.metricVal}>{pool.length}</div>
            <div className={styles.metricLbl}>In pool</div>
          </div>
          <div className={`${styles.card} ${styles.metric}`} style={{ textAlign: "center" }}>
            <div className={styles.metricVal}>{totalTriggered}</div>
            <div className={styles.metricLbl}>Times triggered</div>
          </div>
          <div className={`${styles.card} ${styles.metric}`} style={{ textAlign: "center" }}>
            <div className={styles.metricVal}>{totalLockouts}</div>
            <div className={styles.metricLbl}>Total lockouts</div>
          </div>
        </div>
      </section>

      <PunishmentPoolManager
        initialPool={pool}
        initialMode={config?.mode ?? "RANDOM"}
        initialFixedId={config?.fixedPunishmentId ?? null}
      />
    </>
  );
}
