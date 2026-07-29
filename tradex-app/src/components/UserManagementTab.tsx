import { useState } from "react";
import UserDirectoryTab from "./UserDirectoryTab";
import EmployeeManagement from "./EmployeeManagement";
import Icon from "./Icon";
import type { UserInfo, UserProfile } from "../utils/dashboardHelpers";
import styles from "../Dashboard.module.css";

interface UserManagementTabProps {
  user: UserProfile;
  users: UserInfo[];
  adminLoading: boolean;
}

export default function UserManagementTab({ user, users, adminLoading }: UserManagementTabProps) {
  const showUsers = user.permissions?.includes("MANAGE_USERS") || user.role === "SUPER_ADMIN";
  const showEmployees = user.role === "SUPER_ADMIN";

  // Default to users if permitted, else employees
  const [subTab, setSubTab] = useState<"users" | "employees">(showUsers ? "users" : "employees");

  if (!showUsers && !showEmployees) {
    return (
      <div style={{ padding: "20px", color: "var(--danger)" }}>
        You do not have permission to access User Management.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {showUsers && showEmployees && (
        <div className={styles.adminTabBar} style={{ borderBottom: "1px solid var(--border)", paddingBottom: "4px" }}>
          <button
            type="button"
            onClick={() => setSubTab("users")}
            className={`${styles.adminTab} ${subTab === "users" ? styles.adminTabActive : ""}`}
          >
            <Icon name="group" className={styles.adminTabIcon} />
            Platform Users
          </button>
          <button
            type="button"
            onClick={() => setSubTab("employees")}
            className={`${styles.adminTab} ${subTab === "employees" ? styles.adminTabActive : ""}`}
          >
            <Icon name="badge" className={styles.adminTabIcon} />
            Console Employees
          </button>
        </div>
      )}

      {subTab === "users" && showUsers && (
        <UserDirectoryTab user={user} users={users} adminLoading={adminLoading} />
      )}

      {subTab === "employees" && showEmployees && (
        <EmployeeManagement />
      )}
    </div>
  );
}
