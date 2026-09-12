import type { Metadata } from "next";
import { requireAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { WithdrawalsReview } from "@/components/admin/WithdrawalsReview";
import styles from "../../admin.module.css";

export const metadata: Metadata = {
  title: "Withdrawals — NEETLeveling Admin",
};

function fmtDate(d: Date) {
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }).toUpperCase();
}

export default async function AdminWithdrawalsPage() {
  await requireAdminSession();

  const [pending, paidHistory] = await Promise.all([
    prisma.withdrawalRequest.findMany({
      where: { status: "PENDING" },
      include: { profile: { select: { name: true, email: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.withdrawalRequest.findMany({
      where: { status: "PAID" },
      include: { profile: { select: { name: true } } },
      orderBy: { paidAt: "desc" },
      take: 30,
    }),
  ]);

  return (
    <>
      <WithdrawalsReview
        initialPending={pending.map((p) => ({
          id: p.id,
          hunterName: p.profile.name,
          email: p.profile.email,
          amount: p.amount,
          payeeName: p.payeeName,
          qrCodeUrl: p.qrCodeUrl,
          requestedAt: fmtDate(p.createdAt),
        }))}
      />

      <section>
        <span className={styles.secLabel}>Paid history</span>
        {paidHistory.length === 0 ? (
          <div className={styles.card} style={{ padding: "20px", textAlign: "center", color: "var(--slate)" }}>
            No withdrawals paid yet.
          </div>
        ) : (
          <div className={styles.card}>
            {paidHistory.map((p) => (
              <div
                key={p.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "14px 16px",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 600 }}>{p.profile.name}</div>
                  <div style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "10.5px", color: "var(--slate)", marginTop: "3px" }}>
                    {p.payeeName} · paid {p.paidAt ? fmtDate(p.paidAt) : "—"}
                  </div>
                </div>
                <div style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "13px", color: "var(--green)" }}>
                  ₹{p.amount}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
