"use client";

import { useTransition } from "react";
import { markAllNotificationsRead } from "@/actions/notifications";
import styles from "@/app/(detail)/detail.module.css";

export function MarkAllReadButton() {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      className={styles.headerAction}
      disabled={pending}
      onClick={() => startTransition(() => markAllNotificationsRead())}
    >
      Mark all read
    </button>
  );
}
