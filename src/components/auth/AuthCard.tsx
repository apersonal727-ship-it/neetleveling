"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { signIn, signUp, verifySignupOtp, resendSignupOtp } from "@/actions/auth";
import styles from "@/app/(auth)/auth.module.css";

type Mode = "login" | "signup";

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

// 0-4: length + character-class variety. Purely a UX nudge — the real
// minimum (8 chars) is still enforced by handleSignup below regardless of
// what this shows.
function passwordStrength(password: string): number {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[0-9]/.test(password) && /[a-zA-Z]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  return Math.min(4, score);
}
const STRENGTH_COLOR = ["var(--red)", "var(--red)", "var(--amber)", "var(--blue-2)", "var(--green)"];

const AlertIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M12 9v4M12 17h.01" />
    <circle cx="12" cy="12" r="9" />
  </svg>
);

const ArrowIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export function AuthCard({
  initialMode,
  initialReferralCode = "",
}: {
  initialMode: Mode;
  initialReferralCode?: string;
}) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});
  const [pending, startTransition] = useTransition();
  const [verifyingEmail, setVerifyingEmail] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [signupPassword, setSignupPassword] = useState("");

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  function setModeAndReset(next: Mode) {
    setMode(next);
    setError(null);
    setFieldErrors({});
  }

  function handleVerifyOtp() {
    setError(null);
    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    startTransition(async () => {
      const result = await verifySignupOtp(verifyingEmail!, otp);
      if (result && "error" in result) setError(result.error);
    });
  }

  function handleResendOtp() {
    if (resendCooldown > 0 || !verifyingEmail) return;
    setError(null);
    startTransition(async () => {
      const result = await resendSignupOtp(verifyingEmail);
      if (result && "error" in result) setError(result.error);
      setResendCooldown(30);
    });
  }

  function handleLogin(formData: FormData) {
    setError(null);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const errors: Record<string, boolean> = {};
    if (!isValidEmail(email)) errors.email = true;
    if (!password) errors.password = true;
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    startTransition(async () => {
      const result = await signIn(formData);
      if ("error" in result) {
        setError(result.error);
        setFieldErrors({ email: true, password: true });
      }
    });
  }

  function handleSignup(formData: FormData) {
    setError(null);
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const errors: Record<string, boolean> = {};
    if (!name) errors.name = true;
    if (!isValidEmail(email)) errors.email = true;
    if (password.length < 8) errors.password = true;
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    startTransition(async () => {
      const result = await signUp(formData);
      if ("error" in result) {
        setError(result.error);
        if (result.error.toLowerCase().includes("email")) {
          setFieldErrors({ email: true });
        }
        return;
      }
      if ("needsVerification" in result) {
        setVerifyingEmail(result.email);
        setResendCooldown(30);
      }
    });
  }

  return (
    <>
      <div className="systemBackdrop" />
      <div className={styles.app}>
        <div className={styles.top}>
          <div className={styles.brand}>
            <span className={styles.logoMark} />
            NEETLEVELING
          </div>
          <span className={styles.eyebrow}>
            <span className={styles.dot} /> Hunter identification required
          </span>
        </div>

        <main className={styles.main}>
        <div className={styles.panel}>
          <div className={styles.panelTitlebar}>
            <span>System // Access</span>
            <span className={styles.live}>● System Online</span>
          </div>
          <div className={styles.panelBody}>
          {verifyingEmail ? (
            <>
              <div className={styles.signupNote}>
                <AlertIcon />
                <span>
                  We sent a 6-digit code to <b>{verifyingEmail}</b>. Enter it below to verify your
                  email.
                </span>
              </div>
              {error && (
                <div className={styles.formError}>
                  <AlertIcon />
                  <span>{error}</span>
                </div>
              )}
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Verification code</span>
                <input
                  className={styles.fieldInput}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  style={{ letterSpacing: "0.3em", textAlign: "center", fontFamily: "var(--font-jetbrains-mono), monospace" }}
                />
              </div>
              <button
                type="button"
                className={`${styles.btnPrimary} ${pending ? styles.btnPrimaryLoading : ""}`}
                onClick={handleVerifyOtp}
              >
                <span>Verify Email</span>
                <ArrowIcon />
              </button>
              <div className={styles.switchLine}>
                {resendCooldown > 0 ? (
                  <>Resend code in {resendCooldown}s</>
                ) : (
                  <>
                    Didn&apos;t get it?{" "}
                    <button type="button" onClick={handleResendOtp}>
                      Resend code
                    </button>
                  </>
                )}
                {" · "}
                <button
                  type="button"
                  onClick={() => {
                    setVerifyingEmail(null);
                    setOtp("");
                    setError(null);
                  }}
                >
                  Use a different email
                </button>
              </div>
            </>
          ) : (
            <>
              <div className={styles.modeToggle}>
                <button
                  type="button"
                  className={`${styles.modeBtn} ${mode === "login" ? styles.modeBtnActive : ""}`}
                  onClick={() => setModeAndReset("login")}
                >
                  Log In
                </button>
                <button
                  type="button"
                  className={`${styles.modeBtn} ${mode === "signup" ? styles.modeBtnActive : ""}`}
                  onClick={() => setModeAndReset("signup")}
                >
                  Sign Up
                </button>
              </div>

              {mode === "login" ? (
            <form action={handleLogin}>
              {error && (
                <div className={styles.formError}>
                  <AlertIcon />
                  <span>{error}</span>
                </div>
              )}
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Email</span>
                <input
                  className={`${styles.fieldInput} ${fieldErrors.email ? styles.fieldInputError : ""}`}
                  name="email"
                  type="email"
                  placeholder="you@email.com"
                  autoComplete="email"
                />
              </div>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Password</span>
                <input
                  className={`${styles.fieldInput} ${fieldErrors.password ? styles.fieldInputError : ""}`}
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>
              <div className={styles.forgot}>
                <Link href="/forgot-password">Forgot password?</Link>
              </div>
              <button
                type="submit"
                className={`${styles.btnPrimary} ${pending ? styles.btnPrimaryLoading : ""}`}
              >
                <span>Enter the System</span>
                <ArrowIcon />
              </button>
            </form>
          ) : (
            <form action={handleSignup}>
              {error && (
                <div className={styles.formError}>
                  <AlertIcon />
                  <span>{error}</span>
                </div>
              )}
              <div className={styles.rankPreview}>
                <div className={styles.badge}>E</div>
                <div className={styles.txt}>
                  You start here. <b>E-Rank, Level 1, 0 XP.</b>
                  <br />
                  Every Hunter begins at zero.
                </div>
              </div>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Hunter Name</span>
                <input
                  className={`${styles.fieldInput} ${fieldErrors.name ? styles.fieldInputError : ""}`}
                  name="name"
                  type="text"
                  placeholder="Pick your name"
                  autoComplete="username"
                />
              </div>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Email</span>
                <input
                  className={`${styles.fieldInput} ${fieldErrors.email ? styles.fieldInputError : ""}`}
                  name="email"
                  type="email"
                  placeholder="you@email.com"
                  autoComplete="email"
                />
                {fieldErrors.email && (
                  <div className={styles.fieldHintError}>Enter a valid email address.</div>
                )}
              </div>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Password</span>
                <input
                  className={`${styles.fieldInput} ${fieldErrors.password ? styles.fieldInputError : ""}`}
                  name="password"
                  type="password"
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                />
                <div className={styles.strengthBar}>
                  {[0, 1, 2, 3].map((i) => {
                    const strength = passwordStrength(signupPassword);
                    const active = i < strength;
                    return (
                      <span
                        key={i}
                        data-active={active}
                        style={active ? ({ "--strength-color": STRENGTH_COLOR[strength] } as React.CSSProperties) : undefined}
                      />
                    );
                  })}
                </div>
                {fieldErrors.password && (
                  <div className={styles.fieldHintError}>
                    Password must be at least 8 characters.
                  </div>
                )}
              </div>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Referral code (optional)</span>
                <input
                  className={styles.fieldInput}
                  name="referredByCode"
                  type="text"
                  placeholder="e.g. NEET-XXXXXX"
                  autoComplete="off"
                  defaultValue={initialReferralCode}
                  style={{ textTransform: "uppercase" }}
                />
              </div>
              <button
                type="submit"
                className={`${styles.btnPrimary} ${pending ? styles.btnPrimaryLoading : ""}`}
              >
                <span>Create Hunter Profile</span>
                <ArrowIcon />
              </button>
              <div className={styles.signupNote}>
                <AlertIcon />
                <span>
                  Next: pick your aura and class, then unlock full access for ₹99/month. No free
                  tier.
                </span>
              </div>
            </form>
          )}

          <div className={styles.switchLine}>
            {mode === "login" ? (
              <>
                New here?{" "}
                <button type="button" onClick={() => setModeAndReset("signup")}>
                  Create a Hunter profile
                </button>
              </>
            ) : (
              <>
                Already a Hunter?{" "}
                <button type="button" onClick={() => setModeAndReset("login")}>
                  Log in
                </button>
              </>
            )}
          </div>
            </>
          )}
          </div>
        </div>
        </main>
      </div>
    </>
  );
}
