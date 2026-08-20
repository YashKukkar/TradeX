import { useState, useMemo } from "react";
import Icon from "./Icon";
import { getDisplayName, type UserInfo } from "../utils/dashboardHelpers";
import styles from "../AdminUsers.module.css";
import { fuzzyMatch } from "../utils/fuzzyMatch";
import LoadingState from "./LoadingState";
import DataTable, { type ColumnDef } from "./DataTable";

interface UserAuditRegistryProps {
  users: UserInfo[];
  loading: boolean;
  onRowClick: (u: UserInfo) => void;
}

interface FilteredUser {
  user: UserInfo;
  emailIndices: number[];
}

function StatusPill({ user }: { user: UserInfo }) {
  if (user.locked) return <span className={`${styles.statusPill} ${styles.pillLocked}`}>Locked</span>;
  if (user.enabled === false) return <span className={`${styles.statusPill} ${styles.pillDisabled}`}>Inactive</span>;
  return <span className={`${styles.statusPill} ${styles.pillActive}`}>Active</span>;
}

function HighlightText({ text, indices }: { text: string; indices: number[] }) {
  if (indices.length === 0) return <>{text}</>;
  const indexSet = new Set(indices);
  return (
    <>
      {text.split("").map((char, i) =>
        indexSet.has(i) ? (
          <mark key={i} style={{ backgroundColor: "var(--accent)", color: "var(--bg)", borderRadius: "2px", padding: "0 2px" }}>
            {char}
          </mark>
        ) : char
      )}
    </>
  );
}

const COLUMNS: ColumnDef<FilteredUser>[] = [
  {
    label: "Customer Account",
    width: "210px",
    render: ({ user: u, emailIndices }) => {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <span style={{ fontWeight: 750, fontSize: "14px", color: "var(--text)", lineHeight: 1.2 }}>
            {u.fullName || getDisplayName(u.email)}
          </span>
          <span className={styles.userEmail} style={{ fontSize: "12px", color: "var(--muted)" }}>
            <HighlightText text={u.email} indices={emailIndices} />
          </span>
        </div>
      );
    },
  },
  {
    label: "Wallet Balances",
    width: "180px",
    render: ({ user: u }) => {
      const withdrawable = u.withdrawableBalance ?? 0;
      const bonus = u.bonusBalance ?? 0;
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <span style={{ fontWeight: 700, fontSize: "14px", color: "var(--text)" }}>
            {formatCurrency(withdrawable)}
          </span>
          <span style={{ fontSize: "11px", color: "var(--muted)" }}>
            +{formatCurrency(bonus)} bonus
          </span>
        </div>
      );
    },
  },
  {
    label: "Points Registry",
    width: "180px",
    render: ({ user: u }) => {
      const active = u.pointsBalance ?? 0;
      const acquired = u.pointsAcquired ?? 0;
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <span style={{ fontWeight: 700, fontSize: "14px", color: "var(--text)" }}>
            {active.toLocaleString()} pts
          </span>
          <span style={{ fontSize: "11px", color: "var(--muted)" }}>
            {acquired.toLocaleString()} earned
          </span>
        </div>
      );
    },
  },
  {
    label: "Verification",
    width: "160px",
    render: ({ user: u }) => (
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
        <span
          style={{
            fontSize: "10.5px",
            fontWeight: 700,
            padding: "2px 6px",
            borderRadius: "4px",
            background: u.emailVerified ? "var(--primary-bg)" : "var(--surface-3)",
            color: u.emailVerified ? "var(--primary)" : "var(--muted)",
            border: u.emailVerified ? "1px solid var(--primary-border)" : "1px solid var(--border)",
          }}
        >
          {u.emailVerified ? "✓ Email" : "Email"}
        </span>
        <span
          style={{
            fontSize: "10.5px",
            fontWeight: 700,
            padding: "2px 6px",
            borderRadius: "4px",
            background: u.phoneVerified ? "var(--primary-bg)" : "var(--surface-3)",
            color: u.phoneVerified ? "var(--primary)" : "var(--muted)",
            border: u.phoneVerified ? "1px solid var(--primary-border)" : "1px solid var(--border)",
          }}
        >
          {u.phoneVerified ? "✓ Phone" : "Phone"}
        </span>
      </div>
    ),
  },
  {
    label: "Status",
    width: "100px",
    align: "right",
    render: ({ user: u }) => <StatusPill user={u} />,
  },
];

type StatusFilterType = "ALL" | "ACTIVE" | "INACTIVE" | "LOCKED";
type SortByType = "joined_desc" | "joined_asc" | "name_asc" | "points_desc" | "cash_desc";

import { downloadCsv, generateCsvFilename, formatCurrency, formatNumber, formatDate } from "../utils/formatters";

export default function UserAuditRegistry({ users, loading, onRowClick }: UserAuditRegistryProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>("ALL");
  const [sortBy, setSortBy] = useState<SortByType>("joined_desc");

  // Summary Metrics Computation
  const summary = useMemo(() => {
    const totalUsers = users.length;
    const activeUsers = users.filter((u) => u.enabled !== false && !u.locked).length;
    const inactiveUsers = users.filter((u) => u.enabled === false).length;
    const lockedUsers = users.filter((u) => u.locked === true).length;
    const totalWithdrawable = users.reduce((sum, u) => sum + (u.withdrawableBalance || 0), 0);
    const totalBonus = users.reduce((sum, u) => sum + (u.bonusBalance || 0), 0);
    const totalPoints = users.reduce((sum, u) => sum + (u.pointsBalance || 0), 0);
    const fullyVerified = users.filter((u) => u.emailVerified && u.phoneVerified).length;

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      lockedUsers,
      totalWithdrawable,
      totalBonus,
      totalPoints,
      fullyVerified,
    };
  }, [users]);

  const sorted = useMemo(() => {
    const baseFiltered = search.trim()
      ? users.filter((u) => fuzzyMatch(u.email, search).matched || (u.phoneNumber && fuzzyMatch(u.phoneNumber, search).matched))
      : users;
    const searched: FilteredUser[] = baseFiltered.map((u) => {
      const emailRes = fuzzyMatch(u.email, search);
      return {
        user: u,
        emailIndices: emailRes.indices,
        matched: true,
      };
    });

    const filtered = searched.filter((item) => {
      if (statusFilter === "ALL") return true;
      if (statusFilter === "ACTIVE") return item.user.enabled !== false && !item.user.locked;
      if (statusFilter === "INACTIVE") return item.user.enabled === false;
      if (statusFilter === "LOCKED") return item.user.locked === true;
      return true;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "joined_desc") return (b.user.createdAt || 0) - (a.user.createdAt || 0);
      if (sortBy === "joined_asc") return (a.user.createdAt || 0) - (b.user.createdAt || 0);
      if (sortBy === "name_asc") return getDisplayName(a.user.email).localeCompare(getDisplayName(b.user.email));
      if (sortBy === "points_desc") return (b.user.pointsBalance || 0) - (a.user.pointsBalance || 0);
      if (sortBy === "cash_desc") return (b.user.withdrawableBalance ?? 0) - (a.user.withdrawableBalance ?? 0);
      return 0;
    });
  }, [users, search, statusFilter, sortBy]);

  const handleExportCsv = () => {
    const headers = [
      "User ID",
      "Full Name",
      "Email",
      "Phone Number",
      "Role",
      "Withdrawable Balance (INR)",
      "Bonus Balance (INR)",
      "Active Points",
      "Earned Points",
      "Email Verified",
      "Phone Verified",
      "Status",
      "Joined Date",
    ];

    const rows = sorted.map(({ user: u }) => [
      u.id,
      u.fullName || getDisplayName(u.email),
      u.email,
      u.phoneNumber || "",
      u.role || "USER",
      u.withdrawableBalance ?? 0,
      u.bonusBalance ?? 0,
      u.pointsBalance ?? 0,
      u.pointsAcquired ?? 0,
      u.emailVerified ? "YES" : "NO",
      u.phoneVerified ? "YES" : "NO",
      u.locked ? "LOCKED" : u.enabled === false ? "INACTIVE" : "ACTIVE",
      formatDate(u.createdAt, true),
    ]);

    downloadCsv(generateCsvFilename("Customer_Accounts"), headers, rows);
  };

  const filterCounts: Record<StatusFilterType, number> = {
    ALL: summary.totalUsers,
    ACTIVE: summary.activeUsers,
    INACTIVE: summary.inactiveUsers,
    LOCKED: summary.lockedUsers,
  };

  return (
    <div id="user-directory" className={styles.tableSection}>
      {/* ── Executive Mini-Metrics Summary Bar ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "12px",
          marginBottom: "18px",
        }}
      >
        <div
          style={{
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            borderRadius: "10px",
            padding: "12px 16px",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11.5px", color: "var(--muted)", fontWeight: 600, textTransform: "uppercase" }}>Total Customers</span>
            <Icon name="people" style={{ fontSize: "16px", color: "var(--primary)" }} />
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
            <span style={{ fontSize: "20px", fontWeight: 800, color: "var(--text)" }}>{summary.totalUsers}</span>
            <span style={{ fontSize: "11px", color: "var(--success)", fontWeight: 700 }}>{summary.activeUsers} active</span>
          </div>
        </div>

        <div
          style={{
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            borderRadius: "10px",
            padding: "12px 16px",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11.5px", color: "var(--muted)", fontWeight: 600, textTransform: "uppercase" }}>Customer Capital</span>
            <Icon name="account_balance_wallet" style={{ fontSize: "16px", color: "var(--primary)" }} />
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
            <span style={{ fontSize: "20px", fontWeight: 800, color: "var(--text)" }}>{formatCurrency(summary.totalWithdrawable)}</span>
            <span style={{ fontSize: "11px", color: "var(--muted)" }}>+{formatCurrency(summary.totalBonus)} bonus</span>
          </div>
        </div>

        <div
          style={{
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            borderRadius: "10px",
            padding: "12px 16px",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11.5px", color: "var(--muted)", fontWeight: 600, textTransform: "uppercase" }}>Points in Circulation</span>
            <Icon name="stars" style={{ fontSize: "16px", color: "var(--accent)" }} />
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
            <span style={{ fontSize: "20px", fontWeight: 800, color: "var(--accent)" }}>{formatNumber(summary.totalPoints)} pts</span>
            <span style={{ fontSize: "11px", color: "var(--muted)" }}>across accounts</span>
          </div>
        </div>

        <div
          style={{
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            borderRadius: "10px",
            padding: "12px 16px",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11.5px", color: "var(--muted)", fontWeight: 600, textTransform: "uppercase" }}>Account Health</span>
            <Icon name="verified_user" style={{ fontSize: "16px", color: summary.lockedUsers > 0 ? "var(--warning)" : "var(--success)" }} />
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
            <span style={{ fontSize: "20px", fontWeight: 800, color: "var(--text)" }}>{summary.fullyVerified}</span>
            <span style={{ fontSize: "11px", color: "var(--muted)" }}>verified</span>
            {summary.lockedUsers > 0 && (
              <span style={{ fontSize: "11px", color: "var(--danger)", fontWeight: 700, marginLeft: "auto" }}>
                {summary.lockedUsers} locked
              </span>
            )}
          </div>
        </div>
      </div>

      <div className={styles.tableHeader}>
        <h2 className={styles.tableTitle}>User Accounts Directory</h2>
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={sorted.length === 0}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "7px 12px",
              borderRadius: "8px",
              fontSize: "12px",
              fontWeight: 700,
              cursor: sorted.length === 0 ? "not-allowed" : "pointer",
              background: "var(--surface-2)",
              color: "var(--text)",
              border: "1px solid var(--border)",
              transition: "all 0.2s ease",
            }}
          >
            <Icon name="download" style={{ fontSize: "15px", color: "var(--primary)" }} />
            <span>Export CSV</span>
          </button>

          <div className={styles.searchBox}>
            <Icon name="search" className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search account email, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>
      </div>

      {/* Sorting & Filter Controls Toolbar */}
      <div className={styles.toolbarContainer}>
        <div className={styles.filterTabs}>
          {(["ALL", "ACTIVE", "INACTIVE", "LOCKED"] as const).map((filterOpt) => (
            <button
              key={filterOpt}
              type="button"
              className={`${styles.filterTabBtn} ${statusFilter === filterOpt ? styles.filterTabActive : ""}`}
              onClick={() => setStatusFilter(filterOpt)}
            >
              <span>{filterOpt === "ALL" ? "All Users" : filterOpt.charAt(0) + filterOpt.slice(1).toLowerCase()}</span>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 750,
                  padding: "1px 5px",
                  borderRadius: "10px",
                  marginLeft: "4px",
                  background: statusFilter === filterOpt ? "var(--primary)" : "var(--surface-3)",
                  color: statusFilter === filterOpt ? "var(--primary-bg)" : "var(--muted)",
                }}
              >
                {filterCounts[filterOpt]}
              </span>
            </button>
          ))}
        </div>

        <div className={styles.controlsGroup}>
          <span style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--muted)" }}>Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortByType)}
            className={styles.sortSelect}
          >
            <option value="joined_desc">Newest Joined</option>
            <option value="joined_asc">Oldest Joined</option>
            <option value="name_asc">Name (A-Z)</option>
            <option value="points_desc">Points (High-Low)</option>
            <option value="cash_desc">Cash (High-Low)</option>
          </select>
        </div>
      </div>

      {loading ? (
        <LoadingState message="Querying distributed ledger..." />
      ) : (
        <DataTable
          columns={COLUMNS}
          data={sorted}
          rowKey={(item) => item.user.id}
          emptyMessage="No users found matching current filters."
          onRowClick={(item) => onRowClick(item.user)}
          clickableRow={true}
          pageSize={15}
        />
      )}
    </div>
  );
}
