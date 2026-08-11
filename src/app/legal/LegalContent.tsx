"use client";

import { useState } from "react";
import { FlameIcon } from "@/components/icons/FlameIcon";
import styles from "./legal.module.css";

type Tab = "terms" | "privacy" | "refund";

export function LegalContent() {
  const [tab, setTab] = useState<Tab>("terms");

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <button type="button" className={styles.backBtn} onClick={() => window.history.back()}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div className={styles.brand}>
          <FlameIcon />
          NEETLEVELING
        </div>
      </header>

      <nav className={styles.tabRow}>
        <button
          type="button"
          className={`${styles.tabBtn} ${tab === "terms" ? styles.tabBtnActive : ""}`}
          onClick={() => setTab("terms")}
        >
          Terms of Service
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${tab === "privacy" ? styles.tabBtnActive : ""}`}
          onClick={() => setTab("privacy")}
        >
          Privacy Policy
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${tab === "refund" ? styles.tabBtnActive : ""}`}
          onClick={() => setTab("refund")}
        >
          Refund Policy
        </button>
      </nav>

      <main className={styles.main}>
        {tab === "terms" && (
          <div className={styles.doc}>
            <h1 className={styles.docTitle}>Terms of Service</h1>
            <div className={styles.docUpdated}>Last updated 10 August 2026</div>

            <h2>What NEETLeveling is</h2>
            <p>
              NEETLeveling is a discipline and accountability system for NEET aspirants. We
              provide quests, timers, XP, ranks, and a penalty mechanism — we do <strong>not</strong>{" "}
              provide Physics, Chemistry, or Biology content, coaching, lectures, or test series.
              You bring your own study material; the System governs when and how long you engage
              with it.
            </p>

            <h2>Subscription</h2>
            <p>
              Access is <strong>₹99/month</strong>, billed on a recurring basis with no free tier.
              You can cancel anytime from Settings → Subscription; cancellation takes effect at
              the end of your current billing cycle.
            </p>

            <h2>Quests, Focus Lock &amp; penalties</h2>
            <p>
              Quests are assigned with a fixed duration and a 24-hour window to start them. Once
              started, a quest&apos;s Focus Lock timer runs to completion and cannot be cancelled
              from within the app. Failing to start an assigned quest within its window will lock
              your account until an assigned punishment quest is completed. This is a core,
              non-optional part of how the System works.
            </p>

            <h2>Acceptable use</h2>
            <ul>
              <li>One account per person. Sharing accounts or credentials is not permitted.</li>
              <li>Do not attempt to manipulate XP, streaks, or quest timers through unauthorized means.</li>
              <li>Abusive behavior toward other hunters or NEETLeveling staff may result in suspension.</li>
            </ul>

            <h2>No academic guarantee</h2>
            <p>
              NEETLeveling is a productivity and consistency tool. We make no claims about NEET
              exam outcomes, rank improvement, or admission results — your results depend on the
              content and coaching you choose to study, not on NEETLeveling itself.
            </p>
          </div>
        )}

        {tab === "privacy" && (
          <div className={styles.doc}>
            <h1 className={styles.docTitle}>Privacy Policy</h1>
            <div className={styles.docUpdated}>Last updated 10 August 2026</div>

            <h2>What we collect</h2>
            <ul>
              <li><strong>Account data:</strong> hunter name, email, password (hashed).</li>
              <li><strong>Activity data:</strong> quests started/completed, XP, streaks, penalty history — this is what powers your Status and History pages.</li>
              <li><strong>Payment data:</strong> handled directly by our payment processor (Cashfree). We do not store your card or UPI details on our own servers.</li>
            </ul>

            <h2>What we don&apos;t do</h2>
            <p>
              We do not sell your personal data to third parties. We do not show ads. Referral
              data (who invited whom) is used only to credit your Wallet — it&apos;s never shared
              publicly.
            </p>

            <h2>How we use your data</h2>
            <p>
              Solely to run the product: tracking quest progress, enforcing the penalty system,
              calculating XP and ranks, applying wallet credit, and sending you quest/streak/penalty
              notifications you&apos;ve opted into from Settings.
            </p>

            <h2>Your rights</h2>
            <p>
              You can request a copy of your data or full account deletion at any time from
              Settings → Delete account. Deleting your account permanently erases your quest
              history, streaks, and wallet balance after a 14-day grace period.
            </p>
          </div>
        )}

        {tab === "refund" && (
          <div className={styles.doc}>
            <h1 className={styles.docTitle}>Refund Policy</h1>
            <div className={styles.docUpdated}>Last updated 10 August 2026</div>

            <h2>All payments are final</h2>
            <p>
              Every charge — first payment and every renewal — is <strong>non-refundable</strong>,
              since access to that month&apos;s quests and the full Focus Lock system is granted
              the moment payment succeeds. There is no refund window.
            </p>

            <h2>Cancelling</h2>
            <p>
              You can cancel anytime from Settings → Subscription. Cancelling stops future
              renewals but does not refund the current billing cycle — you keep access until that
              cycle ends.
            </p>

            <h2>Wallet credit</h2>
            <p>
              Referral wallet credit is not cash and cannot be refunded, withdrawn, or exchanged —
              it only ever offsets a future subscription charge. If your account is refunded or
              deleted, any unused credit is forfeited.
            </p>

            <h2>Billing issues</h2>
            <p>
              If you were charged in error — a duplicate charge, a charge after you&apos;d already
              cancelled, or similar — contact support with your account email and payment date and
              we&apos;ll investigate. This is separate from a change-of-mind refund, which isn&apos;t
              available.
            </p>
          </div>
        )}

        <div className={styles.note}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 9v4M12 17h.01" />
            <circle cx="12" cy="12" r="9" />
          </svg>
          <span>
            This is starting-point template text, not legal advice — have it reviewed by a lawyer
            familiar with Indian consumer and subscription law before launch.
          </span>
        </div>
      </main>
    </div>
  );
}
