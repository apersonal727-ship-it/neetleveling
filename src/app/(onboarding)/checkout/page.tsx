import QRCode from "qrcode";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/current-profile";
import { prisma } from "@/lib/prisma";
import { buildUpiLink, MONTHLY_PRICE, UPI_VPA } from "@/lib/payment";
import { UpiPaymentForm } from "@/components/checkout/UpiPaymentForm";
import styles from "../onboarding.module.css";

function nextRenewalLabel() {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default async function CheckoutPage() {
  const profile = await getCurrentProfile();

  const subscriptionActive =
    profile.subscriptionStatus === "ACTIVE" &&
    (!profile.subscriptionRenewsAt || profile.subscriptionRenewsAt.getTime() >= Date.now());
  if (subscriptionActive) redirect("/dashboard");

  const pendingPayment = await prisma.paymentTransaction.findFirst({
    where: { profileId: profile.id, status: "PENDING_REVIEW" },
    orderBy: { createdAt: "desc" },
  });

  const creditToApply = Math.min(profile.walletCredit, MONTHLY_PRICE);
  const amountDue = MONTHLY_PRICE - creditToApply;

  const upiLink = buildUpiLink(amountDue, `NEETLeveling Hunter Access - ${profile.hunterId}`);
  const qrDataUrl = await QRCode.toDataURL(upiLink, { margin: 1, width: 220 });

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

          {pendingPayment ? (
            <section style={{ textAlign: "center" }}>
              <div className={styles.card} style={{ padding: "28px 20px" }}>
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "50%",
                    margin: "0 auto 16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(255,184,79,.12)",
                    border: "1.5px solid var(--amber)",
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="1.8" width="24" height="24">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3.5 2" />
                  </svg>
                </div>
                <h2 style={{ fontSize: "17px", marginBottom: "8px" }}>Payment submitted — under review</h2>
                <p style={{ fontSize: "13px", color: "var(--slate)", lineHeight: 1.6, marginBottom: "4px" }}>
                  Reference: <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", color: "var(--blue-2)" }}>{pendingPayment.reference}</span>
                </p>
                <p style={{ fontSize: "12.5px", color: "var(--slate)", lineHeight: 1.6 }}>
                  An admin verifies payments manually right now — this usually doesn&apos;t take long. You&apos;ll
                  get a notification the moment it&apos;s approved.
                </p>
              </div>
            </section>
          ) : (
            <>
              <section>
                <span className={styles.sectionLabel}>Pay via UPI</span>
                <div className={styles.card} style={{ padding: "24px 20px", textAlign: "center" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrDataUrl}
                    alt="UPI payment QR code"
                    width={180}
                    height={180}
                    style={{ margin: "0 auto 16px", borderRadius: "12px" }}
                  />
                  <a href={upiLink} className={`${styles.btn} ${styles.btnPrimary}`} style={{ marginBottom: "14px" }}>
                    Open UPI App to Pay ₹{amountDue}
                  </a>
                  <div
                    style={{
                      fontFamily: "var(--font-jetbrains-mono), monospace",
                      fontSize: "13px",
                      color: "var(--blue-2)",
                      border: "1px dashed var(--border-strong)",
                      borderRadius: "9px",
                      padding: "10px 14px",
                      marginTop: "14px",
                    }}
                  >
                    {UPI_VPA}
                  </div>
                  <p style={{ fontSize: "11.5px", color: "var(--slate)", marginTop: "10px", lineHeight: 1.6 }}>
                    Scan the QR or tap the button on your phone, pay ₹{amountDue}, then enter the transaction
                    reference below.
                  </p>
                </div>
              </section>

              <section>
                <span className={styles.sectionLabel}>Confirm payment</span>
                <UpiPaymentForm amountDue={amountDue} />
              </section>
            </>
          )}

          <div className={styles.trustLine}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 6 9 17l-5-5" />
            </svg>
            Payments verified manually — no card or bank details ever leave your UPI app
          </div>
        </main>
      </div>
    </>
  );
}
