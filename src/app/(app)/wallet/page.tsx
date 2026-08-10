import type { Metadata } from "next";
import { getCurrentProfile } from "@/lib/current-profile";
import { getWalletData } from "@/lib/wallet";
import { ReferralCard } from "@/components/wallet/ReferralCard";
import appStyles from "../app.module.css";
import styles from "./wallet.module.css";

export const metadata: Metadata = {
  title: "Wallet — NEETLeveling",
};

function fmtDate(d: Date) {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
function fmtRelative(d: Date) {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((startOfToday.getTime() - d.getTime()) / 86400000);
  if (diffDays <= 0) return "TODAY";
  if (diffDays === 1) return "YESTERDAY";
  return `${diffDays} DAYS AGO`;
}

const TX_LABEL: Record<string, string> = {
  REFERRAL_CREDIT: "Referral credit",
  BILL_APPLIED: "Applied to renewal",
  ADMIN_ADJUSTMENT: "Admin adjustment",
};

export default async function WalletPage() {
  const profile = await getCurrentProfile();
  const wallet = await getWalletData(profile.id);

  return (
    <>
      <div className={appStyles.pageHead}>
        <h1>Wallet</h1>
        <p>Credit from referrals — never cash, always toward your bill.</p>
      </div>

      <section className={`${appStyles.card} ${styles.balCard}`}>
        <div className={styles.balLabel}>Available credit</div>
        <div className={styles.balAmount}>₹{wallet.balance}</div>
        <p className={styles.balNote}>Applied automatically at your next renewal. Nothing to withdraw, nothing to request.</p>
        <div className={styles.balDivider} />
        <div className={styles.balNext}>
          <span className={styles.balNextLbl}>
            Next bill{wallet.subscriptionRenewsAt ? ` · ${fmtDate(wallet.subscriptionRenewsAt)}` : ""}
          </span>
          <span className={`${styles.balNextVal} ${wallet.dueNextBill === 0 ? styles.balNextValGreen : ""}`}>
            {wallet.dueNextBill === 0 ? "₹0 due — fully covered" : `₹${wallet.dueNextBill} due`}
          </span>
        </div>
      </section>

      <section>
        <span className={appStyles.secLabel}>Invite hunters</span>
        <div className={`${appStyles.card} ${styles.refCard}`}>
          <div>
            <div className={styles.rtTitle}>Every subscriber you bring in earns you ₹35 credit</div>
            <div className={styles.rtSub}>Applied the moment they complete their first payment.</div>
          </div>
          <ReferralCard referralCode={wallet.referralCode} />
        </div>
      </section>

      <div className={styles.infoLine}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M12 9v4M12 17h.01" />
          <circle cx="12" cy="12" r="9" />
        </svg>
        <span>Credit only ever offsets your own subscription — it can&apos;t be withdrawn, sent, or exchanged for cash.</span>
      </div>

      <section>
        <span className={appStyles.secLabel}>Recent activity</span>
        {wallet.transactions.length === 0 ? (
          <div className={appStyles.card} style={{ padding: "20px", textAlign: "center", color: "var(--slate)", fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "12.5px" }}>
            No wallet activity yet.
          </div>
        ) : (
          <div className={`${appStyles.card} ${styles.txList}`}>
            {wallet.transactions.map((tx) => {
              const isDebit = tx.amount < 0;
              return (
                <div key={tx.id} className={styles.txItem}>
                  <div className={`${styles.txIcon} ${isDebit ? styles.txIconDebit : ""}`}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      {isDebit ? <path d="M5 12h14M13 6l6 6-6 6" /> : <path d="M12 5v14M5 12h14" />}
                    </svg>
                  </div>
                  <div className={styles.txBody}>
                    <div className={styles.txTitle}>{TX_LABEL[tx.kind] ?? tx.description}</div>
                    <div className={styles.txMeta}>{fmtRelative(tx.createdAt)}</div>
                  </div>
                  <div className={`${styles.txAmt} ${isDebit ? styles.txAmtDebit : ""}`}>
                    {isDebit ? "−" : "+"}₹{Math.abs(tx.amount)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
