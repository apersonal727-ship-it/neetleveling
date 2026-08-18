import { requireAdminSession } from "@/lib/admin-auth";
import { adminLogout } from "@/actions/admin-auth";
import { FlameIcon } from "@/components/icons/FlameIcon";
import { AdminNav } from "@/components/admin/AdminNav";
import styles from "../admin.module.css";

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminSession();

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <FlameIcon />
          NEETLEVELING <span className={styles.tag}>ADMIN</span>
        </div>
        <form action={adminLogout}>
          <button type="submit" className={styles.opChip} style={{ background: "none", border: "none", cursor: "pointer" }}>
            Log Out
          </button>
        </form>
      </header>

      <AdminNav />

      <main className={styles.main}>{children}</main>
    </div>
  );
}
