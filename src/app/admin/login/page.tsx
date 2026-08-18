import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { FlameIcon } from "@/components/icons/FlameIcon";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import styles from "../admin.module.css";

export const metadata: Metadata = {
  title: "Admin Login — NEETLeveling",
};

export default async function AdminLoginPage() {
  if (await isAdminAuthenticated()) redirect("/admin/quests");

  return (
    <div className={styles.app} style={{ display: "flex", alignItems: "center", minHeight: "100svh" }}>
      <div style={{ width: "100%" }}>
        <div className={styles.brand} style={{ justifyContent: "center", marginBottom: "28px", fontSize: "17px" }}>
          <FlameIcon />
          NEETLEVELING <span className={styles.tag}>ADMIN</span>
        </div>
        <AdminLoginForm />
      </div>
    </div>
  );
}
