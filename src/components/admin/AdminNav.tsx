"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "@/app/admin/admin.module.css";

const TABS = [
  { href: "/admin/quests", label: "Quests" },
  { href: "/admin/hunters", label: "Hunters" },
  { href: "/admin/broadcast", label: "Broadcast" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/billing", label: "Billing" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className={styles.adminNav}>
      {TABS.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`${styles.adminTab} ${pathname.startsWith(tab.href) ? styles.adminTabActive : ""}`}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
