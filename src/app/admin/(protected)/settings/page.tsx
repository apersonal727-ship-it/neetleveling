import type { Metadata } from "next";
import { requireAdminSession } from "@/lib/admin-auth";
import { CASHFREE_CHECKOUT_MODE } from "@/lib/cashfree";
import { MONTHLY_PRICE, REFERRAL_CREDIT_AMOUNT } from "@/lib/payment";
import { WITHDRAWAL_MIN_BALANCE } from "@/lib/wallet-constants";
import { STREAK_GRACE_PERIOD_DAYS } from "@/lib/subscription";
import styles from "../../admin.module.css";

export const metadata: Metadata = {
  title: "Settings — NEETLeveling Admin",
};

export default async function AdminSettingsPage() {
  await requireAdminSession();

  const cashfreeConnected = Boolean(process.env.CASHFREE_APP_ID && process.env.CASHFREE_SECRET_KEY);

  return (
    <>
      <div className={styles.topbar}>
        <div>
          <div className={styles.topbarTitle}>Admin Settings</div>
          <div className={styles.topbarSub}>Payment gateway status and system configuration</div>
        </div>
      </div>

      <section>
        <span className={styles.secLabel}>
          <span className={styles.dot} />Payment Gateway
        </span>
        <div className={styles.panelBox}>
          <div className={styles.breakdownRow}>
            <div className={styles.breakdownK}>Cashfree Integration</div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: "11px",
                textTransform: "uppercase",
                padding: "6px 14px",
                color: cashfreeConnected ? "var(--green)" : "var(--red)",
                border: `1px solid ${cashfreeConnected ? "rgba(74,222,128,.4)" : "rgba(255,77,94,.4)"}`,
                background: cashfreeConnected ? "rgba(74,222,128,.06)" : "rgba(255,77,94,.06)",
              }}
            >
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "currentColor",
                  boxShadow: "0 0 6px currentColor",
                }}
              />
              {cashfreeConnected ? "Connected" : "Not Configured"}
            </div>
          </div>
          <div className={styles.breakdownRow}>
            <div className={styles.breakdownK}>Environment</div>
            <div className={styles.breakdownV}>
              <b>{CASHFREE_CHECKOUT_MODE === "production" ? "Production" : "Sandbox"}</b>
            </div>
          </div>
        </div>
      </section>

      <section>
        <span className={styles.secLabel}>
          <span className={styles.dot} />System Configuration
        </span>
        <div className={styles.panelBox}>
          <div className={styles.breakdownRow}>
            <div className={styles.breakdownK}>Daily Quest Reset Time</div>
            <div className={styles.breakdownV}>
              <b>5:00 AM IST</b>
            </div>
          </div>
          <div className={styles.breakdownRow}>
            <div className={styles.breakdownK}>Base Penalty (Per Protocol)</div>
            <div className={styles.breakdownV}>
              <b>10 reps</b>
            </div>
          </div>
          <div className={styles.breakdownRow}>
            <div className={styles.breakdownK}>Penalty Escalation Step</div>
            <div className={styles.breakdownV}>
              <b>+5 reps, capped at 50</b>
            </div>
          </div>
          <div className={styles.breakdownRow}>
            <div className={styles.breakdownK}>Subscription Price</div>
            <div className={styles.breakdownV}>
              <b>₹{MONTHLY_PRICE} / month</b>
            </div>
          </div>
          <div className={styles.breakdownRow}>
            <div className={styles.breakdownK}>Referral Credit Per Hunter</div>
            <div className={styles.breakdownV}>
              <b>₹{REFERRAL_CREDIT_AMOUNT}</b>
            </div>
          </div>
          <div className={styles.breakdownRow}>
            <div className={styles.breakdownK}>Withdrawal Unlock Threshold</div>
            <div className={styles.breakdownV}>
              <b>₹{WITHDRAWAL_MIN_BALANCE.toLocaleString("en-IN")}</b>
            </div>
          </div>
          <div className={styles.breakdownRow}>
            <div className={styles.breakdownK}>Streak Grace Period (Lapsed Subs)</div>
            <div className={styles.breakdownV}>
              <b>{STREAK_GRACE_PERIOD_DAYS} days</b>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
