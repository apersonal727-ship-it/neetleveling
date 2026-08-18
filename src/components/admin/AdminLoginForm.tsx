"use client";

import { useState, useTransition } from "react";
import { adminLogin } from "@/actions/admin-auth";
import styles from "@/app/admin/admin.module.css";

export function AdminLoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await adminLogin(formData);
      if (result && "error" in result) setError(result.error);
    });
  }

  return (
    <div className={styles.card} style={{ padding: "24px" }}>
      <form action={handleSubmit}>
        {error && <div className={styles.formError}>{error}</div>}
        <div className={styles.field}>
          <span className={styles.fieldLabel}>Admin Password</span>
          <input
            className={styles.fieldInput}
            name="password"
            type="password"
            autoFocus
            required
          />
        </div>
        <button type="submit" className={styles.btnDeploy} disabled={isPending}>
          {isPending ? "Checking…" : "Log In"}
        </button>
      </form>
    </div>
  );
}
