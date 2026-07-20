import { useState, useEffect } from "react";
import Icon from "./Icon";
import type { UserInfo } from "../utils/dashboardHelpers";
import styles from "../AdminUsers.module.css";
import { fuzzyMatch } from "../utils/fuzzyMatch";
import PermissionsTooltip from "./PermissionsTooltip";

interface UserAuditRegistryProps {
  users: UserInfo[];
  loading: boolean;
  onRowClick: (u: UserInfo) => void;
}

function StatusPill({ user }: { user: UserInfo }) {
  if (user.locked) {
    return <span className={`${styles.statusPill} ${styles.pillLocked}`}>Locked</span>;
  }
  if (user.enabled === false) {
    return <span className={`${styles.statusPill} ${styles.pillDisabled}`}>Disabled</span>;
  }
  return <span className={`${styles.statusPill} ${styles.pillActive}`}>Active</span>;
}

function HighlightText({ text, indices }: { text: string; indices: number[] }) {
  if (indices.length === 0) return <>{text}</>;
  const indexSet = new Set(indices);
  return (
    <>
      {text.split("").map((char, i) =>
        indexSet.has(i) ? (
          <mark
            key={i}
            style={{
              backgroundColor: "rgba(181, 95, 230, 0.4)",
              color: "var(--text)",
              borderRadius: "2px",
              padding: "0 1px",
            }}
          >
            {char}
          </mark>
        ) : (
          char
        )
      )}
    </>
  );
}

export default function UserAuditRegistry({
  users,
  loading,
  onRowClick,
}: UserAuditRegistryProps) {
  const [rawSearch, setRawSearch] = useState("");
  const [search, setSearch] = useState("");

  // ── Debounce rawSearch to search ──────────────────────────────────
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(rawSearch);
    }, 200);
    return () => clearTimeout(handler);
  }, [rawSearch]);

  // ── Apply sequence fuzzy filtering and record match indices ────────
  const filtered = search.trim()
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

  return (
    <div id="user-directory" className={styles.tableSection}>
      <div className={styles.tableHeader}>
        <h2 className={styles.tableTitle}>User Audit Registry</h2>
        <div className={styles.searchBox}>
          <Icon name="search" className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Fuzzy search by email, phone, code..."
            value={rawSearch}
            onChange={(e) => setRawSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      {loading ? (
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Querying distributed ledger...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className={styles.emptyState}>No users found.</div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Phone</th>
                <th>Bank Account</th>
                <th>Referred By</th>
                <th>Invite Code</th>
                <th>Points</th>
                <th style={{ width: "60px", textAlign: "center" }}>Manage</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(({ user: u, emailIndices }) => (
                <tr
                  key={u.id}
                  onClick={() => onRowClick(u)}
                  style={{ cursor: "pointer", transition: "background 0.2s ease" }}
                  className={styles.clickableRow}
                >
                  <td>
                    <span className={styles.idBadge}>#{u.id}</span>
                  </td>
                  <td>
                    <span className={styles.userEmail}>
                      <HighlightText text={u.email} indices={emailIndices} />
                    </span>
                  </td>
                  <td>
                    {u.role === "SUPER_ADMIN" || u.role === "EMPLOYEE" ? (
                      <PermissionsTooltip
                        email={u.email}
                        permissions={u.permissions || undefined}
                        isAdmin={true}
                        align="flex-start"
                      >
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            padding: "4px 8px",
                            borderRadius: "6px",
                            textTransform: "uppercase",
                            letterSpacing: "0.03em",
                            display: "inline-block",
                            background: u.role === "SUPER_ADMIN" ? "rgba(181, 95, 230, 0.15)" : "rgba(0, 224, 164, 0.15)",
                            color: u.role === "SUPER_ADMIN" ? "#b55fe6" : "var(--primary)",
                            border: u.role === "SUPER_ADMIN" ? "1px dashed rgba(181, 95, 230, 0.4)" : "1px dashed rgba(0, 224, 164, 0.4)",
                            cursor: "pointer"
                          }}
                        >
                          {u.role === "SUPER_ADMIN" ? "Admin" : "Employee"}
                        </span>
                      </PermissionsTooltip>
                    ) : (
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          padding: "4px 8px",
                          borderRadius: "6px",
                          textTransform: "uppercase",
                          letterSpacing: "0.03em",
                          display: "inline-block",
                          background: "rgba(255, 255, 255, 0.05)",
                          color: "var(--muted)"
                        }}
                      >
                        User
                      </span>
                    )}
                  </td>
                  <td>
                    <StatusPill user={u} />
                  </td>
                  <td>
                    {u.phoneNumber ? (
                      <span
                        className={`${styles.verifiedPill} ${
                          u.phoneVerified ? styles.pillVerified : styles.pillUnverified
                        }`}
                      >
                        {u.phoneNumber}
                      </span>
                    ) : (
                      <span className={styles.mutedText}>Not set</span>
                    )}
                  </td>
                  <td>{u.accountNumber || <span className={styles.mutedText}>-</span>}</td>
                  <td
                    className={styles.referrerCell}
                    style={{ fontStyle: u.referredByEmail ? "normal" : "italic" }}
                  >
                    {u.referredByEmail || "None"}
                  </td>
                  <td>
                    <code className={styles.codeCell}>{u.referralCode}</code>
                  </td>
                  <td className={styles.pointsCell}>
                    {(u.pointsBalance || 0).toLocaleString()}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "32px",
                        height: "32px",
                        borderRadius: "8px",
                        background: "rgba(255, 255, 255, 0.04)",
                        border: "1px solid var(--border)",
                        color: "var(--muted)",
                        transition: "all 0.2s ease",
                      }}
                      className={styles.manageIconContainer}
                    >
                      <Icon name="settings" style={{ fontSize: "16px" }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
