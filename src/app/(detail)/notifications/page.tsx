import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/current-profile";
import { prisma } from "@/lib/prisma";
import { NotificationItem } from "@/components/notifications/NotificationItem";
import { MarkAllReadButton } from "@/components/notifications/MarkAllReadButton";
import detailStyles from "../detail.module.css";
import styles from "./notifications.module.css";

export const metadata: Metadata = {
  title: "Notifications — NEETLeveling",
};

function fmtTime(d: Date) {
  return d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}

export default async function NotificationsPage() {
  const profile = await getCurrentProfile();
  const notifications = await prisma.notification.findMany({
    where: { profileId: profile.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const groups: Record<"Today" | "Yesterday" | "Earlier", typeof notifications> = {
    Today: [],
    Yesterday: [],
    Earlier: [],
  };
  for (const n of notifications) {
    if (n.createdAt >= today) groups.Today.push(n);
    else if (n.createdAt >= yesterday) groups.Yesterday.push(n);
    else groups.Earlier.push(n);
  }

  return (
    <div className={detailStyles.app}>
      <header className={detailStyles.header}>
        <Link href="/dashboard" className={detailStyles.backBtn}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <h1>Notifications</h1>
        <MarkAllReadButton />
      </header>

      <main className={detailStyles.main}>
        {(["Today", "Yesterday", "Earlier"] as const).map((section) => (
          <div key={section}>
            <span className={styles.secLabel}>{section}</span>
            {groups[section].length === 0 ? (
              <div className={detailStyles.card}>
                <div className={styles.emptyState}>Nothing here</div>
              </div>
            ) : (
              <div className={`${detailStyles.card} ${styles.nList}`}>
                {groups[section].map((n) => (
                  <NotificationItem
                    key={n.id}
                    id={n.id}
                    type={n.type}
                    title={n.title}
                    message={n.message}
                    time={fmtTime(n.createdAt)}
                    unread={!n.read}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </main>
    </div>
  );
}
