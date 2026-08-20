import { useState, useMemo } from "react";
import Icon from "./Icon";
import adminStyles from "../AdminUsers.module.css";
import styles from "./EmployeeManagement.module.css";
import { getDisplayName, type UserInfo } from "../utils/dashboardHelpers";
import { fuzzyMatch } from "../utils/fuzzyMatch";
import DataTable, { type ColumnDef } from "./DataTable";

interface StaffDirectoryTableProps {
  employees: UserInfo[];
  isLoading: boolean;
  isError: boolean;
  getPermissionLabel: (perm: string) => string;
  onSelectEmployee: (emp: UserInfo) => void;
}

type StaffStatusFilter = "ALL" | "ACTIVE" | "DISABLED" | "SUPER_ADMIN";
type StaffSortBy = "joined_desc" | "joined_asc" | "name_asc" | "perms_desc";

export default function StaffDirectoryTable({
  employees,
  isLoading,
  isError,
  getPermissionLabel,
  onSelectEmployee,
}: StaffDirectoryTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StaffStatusFilter>("ALL");
  const [sortBy, setSortBy] = useState<StaffSortBy>("joined_desc");
  const [pageSize, setPageSize] = useState<number>(15);

  const filteredAndSorted = useMemo(() => {
    const term = search.trim().toLowerCase();
    const searched = employees.filter((emp) => {
      if (!term) return true;
      const matchEmail = fuzzyMatch(emp.email, search).matched;
      const matchName = emp.fullName && fuzzyMatch(emp.fullName, search).matched;
      const matchTeam = emp.teams?.some((t) => fuzzyMatch(t, search).matched);
      const matchRole = emp.role && fuzzyMatch(emp.role, search).matched;
      return matchEmail || matchName || matchTeam || matchRole;
    });

    const statusFiltered = searched.filter((emp) => {
      if (statusFilter === "ACTIVE") return emp.enabled !== false && !emp.locked;
      if (statusFilter === "DISABLED") return emp.enabled === false || emp.locked === true;
      if (statusFilter === "SUPER_ADMIN") return emp.role === "SUPER_ADMIN";
      return true;
    });

    return [...statusFiltered].sort((a, b) => {
      if (sortBy === "joined_desc") return (b.createdAt || 0) - (a.createdAt || 0);
      if (sortBy === "joined_asc") return (a.createdAt || 0) - (b.createdAt || 0);
      if (sortBy === "name_asc") return (a.fullName || a.email).localeCompare(b.fullName || b.email);
      if (sortBy === "perms_desc") return (b.permissions?.length || 0) - (a.permissions?.length || 0);
      return 0;
    });
  }, [employees, search, statusFilter, sortBy]);

  const counts = useMemo(() => {
    return {
      ALL: employees.length,
      ACTIVE: employees.filter((e) => e.enabled !== false && !e.locked).length,
      DISABLED: employees.filter((e) => e.enabled === false || e.locked === true).length,
      SUPER_ADMIN: employees.filter((e) => e.role === "SUPER_ADMIN").length,
    };
  }, [employees]);
  
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
              <span
                key={t}
                style={{
                  background: "var(--clr-indigo-a10)",
                  color: "var(--clr-indigo)",
                  border: "1px solid var(--clr-indigo)",
                  borderRadius: "4px",
                  padding: "2px 6px",
                  fontSize: "11px",
                  fontWeight: 650,
                }}
              >
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
          style={{
            padding: "5px 12px",
            fontSize: "11.5px",
            gap: "5px",
            background: "var(--clr-indigo-a10)",
            border: "1px solid var(--clr-indigo)",
            color: "var(--clr-indigo)",
            borderRadius: "6px",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            fontWeight: 750,
            transition: "all 0.15s ease",
          }}
        >
          <Icon name="visibility" style={{ fontSize: "14px" }} />
          View Details
        </button>
      ),
    },
  ];

  return (
    <div className={adminStyles.tableContainer}>
      {/* ── Search & Filter Controls Toolbar ── */}
      <div className={adminStyles.toolbarContainer} style={{ marginTop: "12px", marginBottom: "14px" }}>
        <div className={adminStyles.filterTabs}>
          {(["ALL", "ACTIVE", "DISABLED", "SUPER_ADMIN"] as const).map((opt) => (
            <button
              key={opt}
              type="button"
              className={`${adminStyles.filterTabBtn} ${statusFilter === opt ? adminStyles.filterTabActive : ""}`}
              onClick={() => setStatusFilter(opt)}
            >
              <span>{opt === "ALL" ? "All Staff" : opt === "SUPER_ADMIN" ? "Super Admins" : opt.charAt(0) + opt.slice(1).toLowerCase()}</span>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 750,
                  padding: "1px 5px",
                  borderRadius: "10px",
                  marginLeft: "4px",
                  background: statusFilter === opt ? "var(--clr-indigo)" : "var(--surface-3)",
                  color: statusFilter === opt ? "var(--on-primary)" : "var(--muted)",
                }}
              >
                {counts[opt]}
              </span>
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <div className={adminStyles.searchBox} style={{ width: "230px" }}>
            <Icon name="search" className={adminStyles.searchIcon} />
            <input
              type="text"
              placeholder="Search staff, team, role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={adminStyles.searchInput}
            />
          </div>

          <div className={adminStyles.controlsGroup}>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--muted)" }}>Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as StaffSortBy)}
              className={adminStyles.sortSelect}
            >
              <option value="joined_desc">Newest Added</option>
              <option value="joined_asc">Oldest Added</option>
              <option value="name_asc">Name (A-Z)</option>
              <option value="perms_desc">Most Authorities</option>
            </select>
          </div>

          <div className={adminStyles.controlsGroup}>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--muted)" }}>Rows:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className={adminStyles.sortSelect}
              style={{ width: "70px" }}
            >
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredAndSorted}
        rowKey={(emp) => emp.id}
        emptyMessage="No employees found matching current search/filters."
        onRowClick={onSelectEmployee}
        clickableRow={true}
        pageSize={pageSize}
      />
    </div>
  );
}
