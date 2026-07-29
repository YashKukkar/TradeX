import { useState, useEffect, useMemo } from "react";
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
          <mark key={i} style={{ backgroundColor: "rgba(181, 95, 230, 0.35)", color: "var(--text)", borderRadius: "2px", padding: "0 1px" }}>
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
            {getDisplayName(u.email)}
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
            ₹{withdrawable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span style={{ fontSize: "11px", color: "var(--muted)" }}>
            +₹{bonus.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} bonus
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
            background: u.emailVerified ? "rgba(0, 224, 164, 0.08)" : "rgba(255, 255, 255, 0.03)",
            color: u.emailVerified ? "var(--primary)" : "var(--muted)",
            border: u.emailVerified ? "1px solid rgba(0, 224, 164, 0.15)" : "1px solid var(--border)",
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
            background: u.phoneVerified ? "rgba(0, 224, 164, 0.08)" : "rgba(255, 255, 255, 0.03)",
            color: u.phoneVerified ? "var(--primary)" : "var(--muted)",
            border: u.phoneVerified ? "1px solid rgba(0, 224, 164, 0.15)" : "1px solid var(--border)",
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

export default function UserAuditRegistry({ users, loading, onRowClick }: UserAuditRegistryProps) {
  const [rawSearch, setRawSearch] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>("ALL");
  const [sortBy, setSortBy] = useState<SortByType>("joined_desc");

  useEffect(() => {
    const handler = setTimeout(() => setSearch(rawSearch), 200);
    return () => clearTimeout(handler);
  }, [rawSearch]);

  const sorted = useMemo(() => {
    // 1. Apply search match
    const searched: FilteredUser[] = search.trim()
      ? users
        .map((u) => {
          const emailRes = fuzzyMatch(u.email, search);
          const phoneRes = u.phoneNumber ? fuzzyMatch(u.phoneNumber, search) : { matched: false, indices: [] };
          const inviteRes = u.referralCode ? fuzzyMatch(u.referralCode, search) : { matched: false, indices: [] };
          const idRes = fuzzyMatch(String(u.id), search);
          const roleRes = u.role ? fuzzyMatch(u.role, search) : { matched: false, indices: [] };
          return {
            user: u,
            emailIndices: emailRes.indices,
            matched: emailRes.matched || phoneRes.matched || inviteRes.matched || idRes.matched || roleRes.matched,
          };
        })
        .filter((item) => item.matched)
      : users.map((u) => ({ user: u, emailIndices: [], matched: true }));

    // 2. Apply status filter
    const filtered = searched.filter((item) => {
      if (statusFilter === "ALL") return true;
      if (statusFilter === "ACTIVE") return item.user.enabled !== false && !item.user.locked;
      if (statusFilter === "INACTIVE") return item.user.enabled === false;
      if (statusFilter === "LOCKED") return item.user.locked === true;
      return true;
    });

    // 3. Apply sorting logic
    return [...filtered].sort((a, b) => {
      if (sortBy === "joined_desc") {
        return (b.user.createdAt || 0) - (a.user.createdAt || 0);
      }
      if (sortBy === "joined_asc") {
        return (a.user.createdAt || 0) - (b.user.createdAt || 0);
      }
      if (sortBy === "name_asc") {
        const nameA = getDisplayName(a.user.email).toLowerCase();
        const nameB = getDisplayName(b.user.email).toLowerCase();
        return nameA.localeCompare(nameB);
      }
      if (sortBy === "points_desc") {
        return (b.user.pointsBalance || 0) - (a.user.pointsBalance || 0);
      }
      if (sortBy === "cash_desc") {
        const withdrawableA = a.user.withdrawableBalance ?? 0;
        const withdrawableB = b.user.withdrawableBalance ?? 0;
        return withdrawableB - withdrawableA;
      }
      return 0;
    });
  }, [users, search, statusFilter, sortBy]);

  return (
    <div id="user-directory" className={styles.tableSection}>
      <div className={styles.tableHeader}>
        <h2 className={styles.tableTitle}>User Accounts Directory</h2>
        <div className={styles.searchBox}>
          <Icon name="search" className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search account email, phone..."
            value={rawSearch}
            onChange={(e) => setRawSearch(e.target.value)}
            className={styles.searchInput}
          />
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
              {filterOpt === "ALL" ? "All Users" : filterOpt.charAt(0) + filterOpt.slice(1).toLowerCase()}
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
