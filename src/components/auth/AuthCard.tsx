"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { FlameIcon } from "@/components/icons/FlameIcon";
import { signIn, signUp } from "@/actions/auth";
import styles from "@/app/(auth)/auth.module.css";

type Mode = "login" | "signup";

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

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

export function AuthCard({ initialMode }: { initialMode: Mode }) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});
  const [pending, startTransition] = useTransition();

  function setModeAndReset(next: Mode) {
    setMode(next);
    setError(null);
    setFieldErrors({});
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
      }
    });
  }

  return (
    <>
      <div className={styles.bgGrid} />
      <div className={styles.app}>
        <div className={styles.top}>
          <div className={styles.brand}>
            <FlameIcon className={styles.flame} />
            NEETLEVELING
          </div>
          <span className={styles.eyebrow}>
            <span className={styles.dot} /> Hunter identification required
          </span>
        </div>

        <main className={styles.main}>
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
                />
                {fieldErrors.password && (
                  <div className={styles.fieldHintError}>
                    Password must be at least 8 characters.
                  </div>
                )}
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
        </main>
      </div>
    </>
  );
}
