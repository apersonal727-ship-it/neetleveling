import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/current-profile";
import { prisma } from "@/lib/prisma";
import { MONTHLY_PRICE, finalizeSuccessfulPayment, markFailedPayment } from "@/lib/payment";
import { fetchCashfreeOrder, CASHFREE_CHECKOUT_MODE } from "@/lib/cashfree";
import { PaymentPanel } from "@/components/checkout/PaymentPanel";
import styles from "../onboarding.module.css";

function nextRenewalLabel() {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ order_id?: string }>;
}) {
  const { order_id } = await searchParams;
  const profile = await getCurrentProfile();

  let paymentFailed = false;

  if (order_id) {
    const tx = await prisma.paymentTransaction.findUnique({ where: { cashfreeOrderId: order_id } });
    if (tx && tx.profileId === profile.id) {
      if (tx.status === "SUCCESS") {
        redirect("/dashboard");
      } else if (tx.status === "PENDING") {
        const liveOrder = await fetchCashfreeOrder(order_id).catch(() => null);
        if (liveOrder?.order_status === "PAID") {
          await finalizeSuccessfulPayment(order_id, "");
          redirect("/dashboard");
        } else if (liveOrder?.order_status === "EXPIRED" || liveOrder?.order_status === "TERMINATED") {
          await markFailedPayment(order_id);
          paymentFailed = true;
        } else {
          paymentFailed = true;
        }
      } else if (tx.status === "FAILED") {
        paymentFailed = true;
      }
    }
  }

  const subscriptionActive =
    profile.subscriptionStatus === "ACTIVE" &&
    (!profile.subscriptionRenewsAt || profile.subscriptionRenewsAt.getTime() >= Date.now());
  if (subscriptionActive) redirect("/dashboard");

  const creditToApply = Math.min(profile.walletCredit, MONTHLY_PRICE);
  const amountDue = MONTHLY_PRICE - creditToApply;

  return (
    <>
      <div className="systemBackdrop" />
      <div className={styles.app}>
        <header className={styles.header}>
          <div className={styles.stepTrack}>
            <div className={styles.stepFill} style={{ width: "100%" }} />
          </div>
          <span className={styles.stepLabel}>Step 4 of 4 · Unlock Access</span>
        </header>

        <main className={styles.main}>
          <div className={styles.panel}>
            <span className={styles.panelEyebrow}>
              <span className={styles.dot} /> Activate The System
            </span>
            <h1 className={styles.panelTitle}>One plan. Fully premium.</h1>
            <p className={styles.panelSub}>This is the only step between you and Level 1.</p>

            <div className={`${styles.card} ${styles.summaryCard}`} style={{ marginTop: "24px" }}>
              <div className={styles.summaryTop}>
                <div>
                  <div className={styles.summaryTitle}>Hunter Access</div>
                  <div className={styles.summarySub}>Billed monthly · cancel anytime</div>
                </div>
                <div className={styles.summaryPrice}>
                  ₹99<span>/month</span>
                </div>
              </div>
              <div className={styles.summaryDivider} />
              {creditToApply > 0 && (
                <div className={styles.summaryRow}>
                  <span>Wallet credit applied</span>
                  <b>−₹{creditToApply}</b>
                </div>
              )}
              <div className={styles.summaryRow}>
                <span>Amount due today</span>
                <b>₹{amountDue}</b>
              </div>
              <div className={styles.summaryRow}>
                <span>Next renewal</span>
                <b>{nextRenewalLabel()}</b>
              </div>
            </div>

            {paymentFailed && (
              <div className={styles.formError} style={{ marginTop: "20px" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M12 9v4M12 17h.01" />
                  <circle cx="12" cy="12" r="9" />
                </svg>
                <span>That payment didn&apos;t go through. No charge was made — try again below.</span>
              </div>
            )}

            <div style={{ marginTop: "24px" }}>
              <PaymentPanel amountDue={amountDue} mode={CASHFREE_CHECKOUT_MODE} />
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
