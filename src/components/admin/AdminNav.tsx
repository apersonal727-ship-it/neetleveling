"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "@/app/admin/admin.module.css";

const TABS = [
  { href: "/admin", label: "Overview", icon: "◉" },
  { href: "/admin/hunters", label: "Hunters", icon: "👤" },
  { href: "/admin/quests", label: "Quests", icon: "☑" },
  { href: "/admin/broadcast", label: "Broadcast", icon: "📣" },
  { href: "/admin/withdrawals", label: "Withdrawals", icon: "◆" },
  { href: "/admin/feedback", label: "Bug Reports", icon: "⚑" },
  { href: "/admin/analytics", label: "Revenue", icon: "₹" },
  { href: "/admin/billing", label: "Billing", icon: "💳" },
  { href: "/admin/settings", label: "Settings", icon: "⚙" },
];

export function AdminNav({
  pendingWithdrawals,
  openBugReports,
}: {
  pendingWithdrawals: number;
  openBugReports: number;
}) {
  const pathname = usePathname();

  return (
    <nav className={styles.navScroll}>
      {TABS.map((tab) => {
        const active = tab.href === "/admin" ? pathname === "/admin" : pathname.startsWith(tab.href);
        const badge =
          tab.href === "/admin/withdrawals" && pendingWithdrawals > 0
            ? pendingWithdrawals
            : tab.href === "/admin/feedback" && openBugReports > 0
              ? openBugReports
              : null;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`${styles.navItem} ${active ? styles.navItemActive : ""}`}
          >
            <span className={styles.navIcon}>{tab.icon}</span>
            <span>{tab.label}</span>
            {badge !== null && <span className={styles.navBadge}>{badge}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
