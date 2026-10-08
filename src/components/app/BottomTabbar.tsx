"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_TABS } from "@/lib/nav-tabs";
import styles from "@/app/(app)/app.module.css";

// activeHref pins the highlighted tab for pages that live outside a tab's own
// URL space (e.g. /report-bug belongs under Settings).
export function BottomTabbar({ activeHref }: { activeHref?: string }) {
  const pathname = usePathname();

  return (
    <nav className={styles.tabbar}>
      {NAV_TABS.map((tab) => {
        const active = activeHref ? tab.href === activeHref : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`${styles.tab} ${active ? styles.tabActive : ""}`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              {tab.icon}
            </svg>
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
