"use client";

import { useEffect, useState } from "react";
import styles from "@/app/(app)/dashboard/dashboard.module.css";

export function SystemToast({ message }: { message: string }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const id = setTimeout(() => setVisible(false), 3200);
    return () => clearTimeout(id);
  }, []);

  return (
    <div className={styles.sysToast} data-hidden={!visible}>
      ⚡ <b>[System]</b>&nbsp;{message}
    </div>
  );
}
