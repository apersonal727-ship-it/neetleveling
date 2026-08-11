import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/current-profile";
import { prisma } from "@/lib/prisma";
import { MONTHLY_PRICE, finalizeSuccessfulPayment, markFailedPayment } from "@/lib/payment";
import { fetchCashfreeOrder, CASHFREE_CHECKOUT_MODE } from "@/lib/cashfree";
import { CashfreeCheckoutButton } from "@/components/checkout/CashfreeCheckoutButton";
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
      <div className={styles.bgGrid} />
      <div className={styles.app}>
        <header className={styles.header}>
          <div className={styles.stepTrack}>
            <div className={styles.stepFill} style={{ width: "100%" }} />
          </div>
          <span className={styles.stepLabel}>Step 4 of 4 · Unlock Access</span>
        </header>

        <main className={styles.main}>
          <div className={styles.pageHead}>
            <h1>One plan. Fully premium.</h1>
            <p>This is the only step between you and Level 1.</p>
          </div>

          <div className={`${styles.card} ${styles.summaryCard}`}>
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
            <div className={styles.formError}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 9v4M12 17h.01" />
                <circle cx="12" cy="12" r="9" />
              </svg>
              <span>That payment didn&apos;t go through. No charge was made — try again below.</span>
            </div>
          )}

          <section>
            <span className={styles.sectionLabel}>Pay securely</span>
            <div className={styles.card} style={{ padding: "24px 20px", textAlign: "center" }}>
              <p style={{ fontSize: "12.5px", color: "var(--slate)", marginBottom: "16px", lineHeight: 1.6 }}>
                You&apos;ll be taken to a secure Cashfree checkout to pay via UPI, card, or netbanking.
                Access unlocks automatically the moment payment is confirmed.
              </p>
              <CashfreeCheckoutButton amountDue={amountDue} mode={CASHFREE_CHECKOUT_MODE} />
            </div>
          </section>

          <div className={styles.trustLine}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 6 9 17l-5-5" />
            </svg>
            Payments processed by Cashfree — verified automatically, no manual review
          </div>
        </main>
      </div>
    </>
  );
}
