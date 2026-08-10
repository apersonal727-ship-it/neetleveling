import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/current-profile";
import { DeleteAccountFlow } from "./DeleteAccountFlow";
import styles from "../detail.module.css";

export const metadata: Metadata = {
  title: "Delete Account — NEETLeveling",
};

export default async function DeleteAccountPage() {
  const profile = await getCurrentProfile();

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <Link href="/settings" className={styles.backBtn}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <h1>Delete Account</h1>
      </header>

      <main className={styles.main}>
        <DeleteAccountFlow hunterName={profile.name} />
      </main>
    </div>
  );
}
