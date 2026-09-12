import type { Metadata } from "next";
import { getCurrentProfile } from "@/lib/current-profile";
import { getWalletData, getReferralData, getWithdrawalHistory } from "@/lib/wallet";
import { WITHDRAWAL_MIN_BALANCE } from "@/lib/wallet-constants";
import { REFERRAL_CREDIT_AMOUNT } from "@/lib/payment";
import { ReferralCard } from "@/components/wallet/ReferralCard";
import { WithdrawBlock } from "@/components/wallet/WithdrawBlock";
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
  WITHDRAWAL_REQUESTED: "Withdrawal requested",
};

export default async function WalletPage() {
  const profile = await getCurrentProfile();
  const wallet = await getWalletData(profile.id);
  const [referral, withdrawals] = await Promise.all([
    getReferralData(profile.id, wallet.referralCode),
    getWithdrawalHistory(profile.id),
  ]);

  return (
    <>
      <div className={appStyles.pageHead}>
        <span className={appStyles.pageEyebrow}>
          <span className={appStyles.dot} />
          Bring A Friend
        </span>
        <h1>Wallet</h1>
        <p>Credit from referrals — never cash, always toward your bill.</p>
      </div>

      <div className={styles.freeCallout}>
        <h3>
          Refer <span className={styles.goldPart}>5 Hunters</span> — Use The System{" "}
          <span className={styles.goldPart}>Free</span> Next Month.
          <br />
          Refer More — Start <span className={styles.cyanPart}>Earning</span>.
        </h3>
        <p>
          5 credited referrals (₹{REFERRAL_CREDIT_AMOUNT * 5}) covers your entire ₹99 bill.
          Everything past that goes straight to your wallet.
        </p>
      </div>

      <section className={`${appStyles.card} ${styles.balCard}`}>
        <div className={styles.balLabel}>Available Balance</div>
        <div className={styles.balAmount}>₹{wallet.balance}</div>
        <p className={styles.balNote}>
          Applied automatically to your next <b>₹99</b> bill — or withdraw manually below.
        </p>
        <div className={styles.balDivider} />
        <div className={styles.balNext}>
          <span className={styles.balNextLbl}>
            Next bill{wallet.subscriptionRenewsAt ? ` · ${fmtDate(wallet.subscriptionRenewsAt)}` : ""}
          </span>
          <span className={`${styles.balNextVal} ${wallet.dueNextBill === 0 ? styles.balNextValGreen : ""}`}>
            {wallet.dueNextBill === 0 ? "₹0 due — fully covered" : `₹${wallet.dueNextBill} due`}
          </span>
        </div>
        <WithdrawBlock balance={wallet.balance} hasPendingWithdrawal={!!wallet.pendingWithdrawal} />
      </section>

      <section>
        <span className={appStyles.secLabel}>Invite hunters</span>
        <div className={`${appStyles.card} ${styles.refCard}`}>
          <div>
            <div className={styles.rtTitle}>Every subscriber you bring in earns you ₹{REFERRAL_CREDIT_AMOUNT} credit</div>
            <div className={styles.rtSub}>Applied the moment they complete their first payment.</div>
          </div>
          <ReferralCard referralCode={wallet.referralCode} />
        </div>
      </section>

      <section>
        <div className={styles.refStats}>
          <div className={styles.refTile}>
            <div className={`${styles.refNum} ${styles.violet}`}>{referral.invited}</div>
            <div className={styles.refLbl}>Invited</div>
          </div>
          <div className={styles.refTile}>
            <div className={`${styles.refNum} ${styles.gold}`}>{referral.credited}</div>
            <div className={styles.refLbl}>Credited</div>
          </div>
          <div className={styles.refTile}>
            <div className={styles.refNum}>{referral.notYetJoined}</div>
            <div className={styles.refLbl}>Not Yet Joined</div>
          </div>
        </div>
      </section>

      <section>
        <span className={appStyles.secLabel}>Your recruits</span>
        {referral.recruits.length === 0 ? (
          <div className={styles.recruitEmpty}>
            <div className={styles.recruitEmptyIcon}>📡</div>
            <div className={styles.recruitEmptyTitle}>No Recruits Yet.</div>
            <div className={styles.recruitEmptySub}>
              Share your referral code above. The moment someone joins and pays, they&apos;ll show
              up here — and so will your ₹{REFERRAL_CREDIT_AMOUNT}.
            </div>
          </div>
        ) : (
          <div className={styles.recruitBox}>
            {referral.recruits.map((r, i) => (
              <div key={i} className={styles.recruitRow}>
                <div className={styles.recruitAvatar}>{r.name.charAt(0).toUpperCase()}</div>
                <div className={styles.recruitInfo}>
                  <div className={styles.recruitName}>{r.name}</div>
                  <div className={styles.recruitMeta}>
                    {r.rankCode}-Rank · LVL {r.level}
                  </div>
                </div>
                <div className={`${styles.recruitBadge} ${r.credited ? styles.credited : styles.pending}`}>
                  {r.credited ? `+₹${REFERRAL_CREDIT_AMOUNT} Earned` : "Not Paid Yet"}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {withdrawals.length > 0 && (
        <section>
          <span className={appStyles.secLabel}>Withdrawal requests</span>
          <div className={styles.wdBox}>
            {withdrawals.map((w) => (
              <div key={w.id} className={styles.wdRow}>
                <div>
                  <div className={styles.wdAmt}>₹{w.amount}</div>
                  <div className={styles.wdMeta}>
                    Requested {fmtDate(w.createdAt)} · QR code uploaded
                  </div>
                </div>
                <div className={`${styles.wdStatus} ${w.status === "PAID" ? styles.completed : styles.pending}`}>
                  {w.status === "PAID" ? "Completed" : "Pending"}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className={styles.infoLine}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M12 9v4M12 17h.01" />
          <circle cx="12" cy="12" r="9" />
        </svg>
        <span>
          Credit auto-applies to your own subscription first. Once your balance crosses ₹
          {WITHDRAWAL_MIN_BALANCE}, you can request a manual UPI payout instead — it can&apos;t be
          sent to anyone else or exchanged for anything but ₹ credit.
        </span>
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
