import { requireAdminSession } from "@/lib/admin-auth";
import { adminLogout } from "@/actions/admin-auth";
import { prisma } from "@/lib/prisma";
import { FlameIcon } from "@/components/icons/FlameIcon";
import { AdminNav } from "@/components/admin/AdminNav";
import styles from "../admin.module.css";

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminSession();

  const [pendingWithdrawals, openBugReports] = await Promise.all([
    prisma.withdrawalRequest.count({ where: { status: "PENDING" } }),
    prisma.bugReport.count({ where: { status: "OPEN" } }),
  ]);

  return (
    <div className={styles.shell}>
      <div className={styles.sideNav}>
        <div className={styles.sideBrand}>
          <FlameIcon />
          <div>
            <div className={styles.sideBrandText}>NEETLEVELING</div>
            <div className={styles.sideBrandTag}>Admin</div>
          </div>
        </div>
        <AdminNav pendingWithdrawals={pendingWithdrawals} openBugReports={openBugReports} />
        <div className={styles.sideFooter}>
          <form action={adminLogout}>
            <button type="submit" className={styles.opChip}>
              Log Out
            </button>
          </form>
        </div>
      </div>

      <main className={styles.main}>{children}</main>
    </div>
  );
}
