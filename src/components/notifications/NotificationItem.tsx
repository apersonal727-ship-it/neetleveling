"use client";

import { useTransition } from "react";
import { markNotificationRead } from "@/actions/notifications";
import styles from "@/app/(detail)/notifications/notifications.module.css";

const ICONS: Record<string, React.ReactNode> = {
  QUEST: <path d="M4 6h16M4 12h16M4 18h10" />,
  STREAK: (
    <path d="M12 2C12 2 7 7.5 7 13a5 5 0 0 0 10 0c0-1.2-.4-2-1-2.8.1 1-.3 1.8-1 2.3.3-2.5-1-4-1.6-5.2C13 6 13.4 4 12 2Z" />
  ),
  PENALTY: (
    <>
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </>
  ),
  SYSTEM: <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z" />,
  WALLET: (
    <>
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 10h18M16 14h2" />
    </>
  ),
};

const ICON_CLASS: Record<string, string> = {
  QUEST: styles.nIconQuest,
  STREAK: styles.nIconStreak,
  PENALTY: styles.nIconPenalty,
  SYSTEM: styles.nIconSystem,
  WALLET: styles.nIconWallet,
};

export function NotificationItem({
  id,
  type,
  title,
  message,
  time,
  unread,
}: {
  id: string;
  type: string;
  title: string;
  message: string;
  time: string;
  unread: boolean;
}) {
  const [, startTransition] = useTransition();

  return (
    <button
      type="button"
      className={`${styles.nItem} ${unread ? styles.nItemUnread : ""}`}
      onClick={() => {
        if (unread) startTransition(() => markNotificationRead(id));
      }}
    >
      <div className={`${styles.nIcon} ${ICON_CLASS[type] ?? styles.nIconSystem}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
          {ICONS[type] ?? ICONS.SYSTEM}
        </svg>
      </div>
      <div className={styles.nBody}>
        <div className={styles.nTitle}>{title}</div>
        <div className={styles.nMsg}>{message}</div>
        <div className={styles.nTime}>{time.toUpperCase()}</div>
      </div>
      {unread && <span className={styles.nDot} />}
    </button>
  );
}
