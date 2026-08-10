import { requireAdminProfile } from "@/lib/current-profile";
import { FlameIcon } from "@/components/icons/FlameIcon";
import { AdminNav } from "@/components/admin/AdminNav";
import styles from "./admin.module.css";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminProfile();

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <FlameIcon />
          NEETLEVELING <span className={styles.tag}>ADMIN</span>
        </div>
        <span className={styles.opChip}>Operator</span>
      </header>

      <AdminNav />

      <main className={styles.main}>{children}</main>
    </div>
  );
}
