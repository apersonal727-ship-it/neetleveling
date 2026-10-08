import Link from "next/link";
import styles from "./SupportLink.module.css";

// A quiet way out on the pages hunters land on when something is wrong
// (locked, lapsed, payment trouble) — the exact moments they need to reach
// the admin and the rest of the app is least likely to be usable.
export function SupportLink({ label = "Something wrong? Contact us" }: { label?: string }) {
  return (
    <Link href="/report-bug" className={styles.link}>
      {label} →
    </Link>
  );
}
