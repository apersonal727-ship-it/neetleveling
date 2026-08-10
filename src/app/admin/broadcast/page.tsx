import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireAdminProfile } from "@/lib/current-profile";
import { BroadcastForm } from "@/components/admin/BroadcastForm";
import styles from "../admin.module.css";

export const metadata: Metadata = {
  title: "Broadcast — NEETLeveling Admin",
};

function fmtRelative(d: Date) {
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (days <= 0) return "TODAY";
  if (days === 1) return "1 DAY AGO";
  return `${days} DAYS AGO`;
}

export default async function AdminBroadcastPage() {
  await requireAdminProfile();

  const sent = await prisma.broadcast.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return (
    <>
      <BroadcastForm />

      <section>
        <span className={styles.secLabel}>Sent recently</span>
        {sent.length === 0 ? (
          <div className={styles.card} style={{ padding: "20px", textAlign: "center", color: "var(--slate)", fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "12px" }}>
            No broadcasts sent yet.
          </div>
        ) : (
          <div className={styles.card}>
            {sent.map((b) => (
              <div key={b.id} style={{ padding: "16px", borderBottom: "1px solid var(--border)" }}>
                <div style={{ fontSize: "13.5px", fontWeight: 600 }}>{b.title}</div>
                <div style={{ fontSize: "12px", color: "var(--slate)", marginTop: "3px", lineHeight: 1.5 }}>{b.message}</div>
                <div style={{ display: "flex", gap: "12px", marginTop: "8px", fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "10px", color: "var(--slate)" }}>
                  <span>{fmtRelative(b.createdAt)}</span>
                  <span>{b.audience.toUpperCase()}</span>
                  <b style={{ color: "var(--green)" }}>{b.sentCount} SENT</b>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
