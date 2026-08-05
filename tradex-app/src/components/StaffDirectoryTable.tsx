import Icon from "./Icon";
import adminStyles from "../AdminUsers.module.css";
import styles from "./EmployeeManagement.module.css";
import { getDisplayName, type UserInfo } from "../utils/dashboardHelpers";
import DataTable, { type ColumnDef } from "./DataTable";

interface StaffDirectoryTableProps {
  employees: UserInfo[];
  isLoading: boolean;
  isError: boolean;
  getPermissionLabel: (perm: string) => string;
  onSelectEmployee: (emp: UserInfo) => void;
}

export default function StaffDirectoryTable({
  employees,
  isLoading,
  isError,
  getPermissionLabel,
  onSelectEmployee,
}: StaffDirectoryTableProps) {
  
  if (isLoading) {
    return <div style={{ padding: "40px", textAlign: "center", color: "var(--muted)" }}>Loading employee accounts...</div>;
  }

  if (isError) {
    return <div style={{ padding: "40px", textAlign: "center", color: "var(--danger)" }}>Failed to load employee directory.</div>;
  }

  if (employees.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Icon name="badge" className={styles.emptyIcon} />
        <p className={styles.emptyTitle}>No Employees Registered</p>
        <p className={styles.emptySub}>Create one above to delegate work.</p>
      </div>
    );
  }

  const columns: ColumnDef<UserInfo>[] = [
    {
      label: "Employee Account",
      render: (emp) => (
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <span style={{ fontWeight: 700, fontSize: "14px", color: "var(--text)" }}>
            {emp.fullName || getDisplayName(emp.email)}
          </span>
          <span className={styles.employeeEmail} style={{ fontSize: "12px", color: "var(--muted)" }}>
            {emp.email}
          </span>
        </div>
      ),
    },
    {
      label: "Assigned Teams",
      render: (emp) => (
        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
          {emp.teams && emp.teams.length > 0 ? (
            emp.teams.map((t) => (
              <span key={t} className={styles.teamTag}>
                {t}
              </span>
            ))
          ) : (
            <span className={styles.noTeamTag}>No Teams</span>
          )}
        </div>
      ),
    },
    {
      label: "Direct Authorities",
      render: (emp) => (
        <div className={styles.permissionsList}>
          {emp.permissions && emp.permissions.length > 0 ? (
            emp.permissions.slice(0, 3).map((p) => (
              <span key={p} className={styles.permTag}>
                {getPermissionLabel(p)}
              </span>
            ))
          ) : (
            <span className={styles.noTeamTag}>None</span>
          )}
          {emp.permissions && emp.permissions.length > 3 && (
            <span style={{ fontSize: "10px", color: "var(--muted)" }}>
              +{emp.permissions.length - 3} more
            </span>
          )}
        </div>
      ),
    },
    {
      label: "Status",
      width: "100px",
      render: (emp) => (
        <span className={`${styles.statusPill} ${emp.enabled ? styles.statusActive : styles.statusDisabled}`}>
          {emp.enabled ? "Active" : "Disabled"}
        </span>
      ),
    },
    {
      label: "Action",
      align: "right",
      width: "130px",
      render: (emp) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelectEmployee(emp);
          }}
          className={adminStyles.approveBtn}
          style={{ padding: "4px 10px", fontSize: "11px", gap: "4px" }}
        >
          <Icon name="visibility" style={{ fontSize: "14px" }} />
          View Details
        </button>
      ),
    },
  ];

  return (
    <div className={adminStyles.tableContainer}>
      <DataTable
        columns={columns}
        data={employees}
        rowKey={(emp) => emp.id}
        emptyMessage="No employees found."
        onRowClick={onSelectEmployee}
        clickableRow={true}
      />
    </div>
  );
}
