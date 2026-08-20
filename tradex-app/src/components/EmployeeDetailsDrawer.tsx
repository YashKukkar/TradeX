import { useState, useMemo } from "react";
import Icon from "./Icon";
import ActionButton from "./ActionButton";
import adminStyles from "../AdminUsers.module.css";
import styles from "./EmployeeManagement.module.css";
import type { TeamData, PermissionRegistryData } from "../hooks/useAdmin";
import type { UserInfo } from "../utils/dashboardHelpers";
import { getDisplayName } from "../utils/dashboardHelpers";
import { useRegisterOverlay } from "../context/OverlayContext";

interface EmployeeDetailsDrawerProps {
  employee: UserInfo;
  teams: TeamData[];
  systemPermissions: PermissionRegistryData[];
  onClose: () => void;
  onToggleTeam: (emp: UserInfo, teamName: string) => void;
  onTogglePermission: (emp: UserInfo, perm: string) => void;
  onDeactivate: (empId: number, email: string) => void;
  pendingPermissionKey?: string | null;
  pendingTeamName?: string | null;
  isDeactivating?: boolean;
}

type DrawerTab = "teams" | "permissions" | "security";

export default function EmployeeDetailsDrawer({
  employee,
  teams,
  systemPermissions,
  onClose,
  onToggleTeam,
  onTogglePermission,
  onDeactivate,
  pendingPermissionKey,
  pendingTeamName,
  isDeactivating = false,
}: EmployeeDetailsDrawerProps) {
  useRegisterOverlay("employee-drawer", true);
  const [activeTab, setActiveTab] = useState<DrawerTab>("permissions");

  // Calculate inherited permissions with metadata on source teams
  const inheritanceSources = useMemo(() => {
    return (employee.teams || []).reduce((acc, tName) => {
      const team = teams.find((t) => t.name === tName);
      if (team) {
        team.permissions.forEach((perm) => {
          if (!acc[perm]) {
            acc[perm] = [];
          }
          acc[perm].push(team.name);
        });
      }
      return acc;
    }, {} as Record<string, string[]>);
  }, [employee.teams, teams]);

  const totalEffectivePerms = useMemo(() => {
    const direct = new Set(employee.permissions || []);
    Object.keys(inheritanceSources).forEach((p) => direct.add(p));
    return direct.size;
  }, [employee.permissions, inheritanceSources]);

  // Sort: Direct Active first, then Squad Inherited, then Inactive
  const sortedPermissions = useMemo(() => {
    return [...systemPermissions].sort((a, b) => {
      const aDirect = (employee.permissions || []).includes(a.key);
      const bDirect = (employee.permissions || []).includes(b.key);
      const aInherited = !!inheritanceSources[a.key] && inheritanceSources[a.key].length > 0;
      const bInherited = !!inheritanceSources[b.key] && inheritanceSources[b.key].length > 0;
      const aScore = aDirect ? 2 : aInherited ? 1 : 0;
      const bScore = bDirect ? 2 : bInherited ? 1 : 0;
      if (aScore !== bScore) return bScore - aScore;
      return (a.displayName || a.key).localeCompare(b.displayName || b.key);
    });
  }, [systemPermissions, employee.permissions, inheritanceSources]);

  const initials = (employee.fullName || employee.email)
    .split("@")[0]
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <div className={adminStyles.drawerBackdrop} onClick={onClose} />
      <aside className={adminStyles.drawerContainer} style={{ width: "min(580px, 94vw)" }}>
        {/* ── Top Header ── */}
        <div className={adminStyles.drawerHeader} style={{ background: "var(--surface-elevated)", borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "10px",
                background: "var(--clr-indigo-a10)",
                border: "1px solid var(--clr-indigo)",
                color: "var(--clr-indigo)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: "15px",
                letterSpacing: "0.05em",
              }}
            >
              {initials}
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "var(--text)" }}>
                  {employee.fullName || getDisplayName(employee.email)}
                </h3>
                <span
                  className={`${styles.statusPill} ${employee.enabled ? styles.statusActive : styles.statusDisabled}`}
                  style={{ fontSize: "10px", padding: "2px 6px" }}
                >
                  {employee.enabled ? "Active" : "Disabled"}
                </span>
              </div>
              <span style={{ fontSize: "12px", color: "var(--muted)" }}>{employee.email}</span>
            </div>
          </div>

          <button className={adminStyles.drawerCloseBtn} onClick={onClose} title="Close drawer">
            <Icon name="close" style={{ fontSize: "18px" }} />
          </button>
        </div>

        {/* ── Quick Summary Metric Badges ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "8px",
            padding: "12px 24px",
            background: "var(--surface-recessed)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "10.5px", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>Account ID</span>
            <span style={{ fontSize: "13px", fontWeight: 800, color: "var(--text)" }}>#{employee.id}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "10.5px", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>Assigned Teams</span>
            <span style={{ fontSize: "13px", fontWeight: 800, color: "var(--clr-indigo)" }}>{(employee.teams || []).length} Squads</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "10.5px", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>Total Access</span>
            <span style={{ fontSize: "13px", fontWeight: 800, color: "var(--accent)" }}>{totalEffectivePerms} Perms</span>
          </div>
        </div>

        {/* ── Drawer Tab Navigation ── */}
        <div
          style={{
            display: "flex",
            padding: "8px 24px 0 24px",
            background: "var(--surface)",
            borderBottom: "1px solid var(--border)",
            gap: "12px",
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab("permissions")}
            style={{
              padding: "8px 12px",
              background: "none",
              border: "none",
              borderBottom: activeTab === "permissions" ? "2px solid var(--clr-indigo)" : "2px solid transparent",
              color: activeTab === "permissions" ? "var(--clr-indigo)" : "var(--muted)",
              fontWeight: 750,
              fontSize: "13px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Icon name="shield" style={{ fontSize: "15px" }} />
            <span>Authorities Matrix ({totalEffectivePerms})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("teams")}
            style={{
              padding: "8px 12px",
              background: "none",
              border: "none",
              borderBottom: activeTab === "teams" ? "2px solid var(--clr-indigo)" : "2px solid transparent",
              color: activeTab === "teams" ? "var(--clr-indigo)" : "var(--muted)",
              fontWeight: 750,
              fontSize: "13px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Icon name="groups" style={{ fontSize: "15px" }} />
            <span>Assigned Squads ({(employee.teams || []).length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("security")}
            style={{
              padding: "8px 12px",
              background: "none",
              border: "none",
              borderBottom: activeTab === "security" ? "2px solid var(--clr-indigo)" : "2px solid transparent",
              color: activeTab === "security" ? "var(--clr-indigo)" : "var(--muted)",
              fontWeight: 750,
              fontSize: "13px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Icon name="settings" style={{ fontSize: "15px" }} />
            <span>Settings & Access</span>
          </button>
        </div>

        {/* ── Scrollable Tab Body ── */}
        <div className={adminStyles.drawerContent}>
          {/* TAB 1: PERMISSIONS MATRIX */}
          {activeTab === "permissions" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
                <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                  Active permissions are ordered at the top. Direct authorities override squad defaults.
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "4px" }}>
                {sortedPermissions.map((perm) => {
                  const isDirect = (employee.permissions || []).includes(perm.key);
                  const sources = inheritanceSources[perm.key];
                  const isInherited = !!sources && sources.length > 0;
                  const isActive = isDirect || isInherited;

                  return (
                    <div
                      key={perm.key}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "14px 16px",
                        borderRadius: "10px",
                        background: isActive ? "var(--surface-elevated)" : "var(--surface-2)",
                        border: isDirect
                          ? "1px solid var(--success-border)"
                          : isInherited
                          ? "1px solid var(--accent)"
                          : "1px solid var(--border)",
                        borderLeft: isDirect
                          ? "4px solid var(--success)"
                          : isInherited
                          ? "4px solid var(--accent)"
                          : "4px solid var(--border)",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div style={{ display: "flex", flexDirection: "column", gap: "3px", maxWidth: "68%" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "13.5px", fontWeight: 750, color: "var(--text)" }}>
                            {perm.displayName || perm.key}
                          </span>
                          {isDirect && (
                            <span
                              style={{
                                fontSize: "10px",
                                fontWeight: 800,
                                padding: "1px 6px",
                                borderRadius: "4px",
                                background: "var(--success-bg)",
                                color: "var(--success)",
                                border: "1px solid var(--success-border)",
                              }}
                            >
                              Direct
                            </span>
                          )}
                          {isInherited && (
                            <span
                              style={{
                                fontSize: "10px",
                                fontWeight: 800,
                                padding: "1px 6px",
                                borderRadius: "4px",
                                background: "var(--warning-bg)",
                                color: "var(--accent)",
                                border: "1px solid var(--warning-border)",
                              }}
                            >
                              Squad Inherited
                            </span>
                          )}
                        </div>

                        <div style={{ fontSize: "11.5px", color: "var(--muted)", lineHeight: 1.4 }}>
                          {perm.description || perm.key}
                        </div>

                        {isInherited && (
                          <div style={{ fontSize: "11px", color: "var(--accent)", display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                            <Icon name="link" style={{ fontSize: "13px" }} />
                            <span>Granted via squad: {sources.join(", ")}</span>
                          </div>
                        )}
                      </div>

                      <div>
                        {isDirect ? (
                          <ActionButton
                            iconName="remove_circle_outline"
                            loading={pendingPermissionKey === perm.key}
                            loadingText="Revoking..."
                            onClick={() => onTogglePermission(employee, perm.key)}
                            style={{
                              padding: "6px 12px",
                              borderRadius: "6px",
                              fontSize: "11.5px",
                              fontWeight: 750,
                              border: "1px solid var(--danger-border)",
                              background: "var(--danger-bg)",
                              color: "var(--danger)",
                            }}
                          >
                            Revoke Access
                          </ActionButton>
                        ) : isInherited ? (
                          <span
                            style={{
                              padding: "6px 12px",
                              borderRadius: "6px",
                              fontSize: "11.5px",
                              fontWeight: 750,
                              border: "1px solid var(--warning-border)",
                              background: "var(--warning-bg)",
                              color: "var(--accent)",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <Icon name="lock" style={{ fontSize: "14px" }} />
                            <span>Inherited (Squad)</span>
                          </span>
                        ) : (
                          <ActionButton
                            iconName="add"
                            loading={pendingPermissionKey === perm.key}
                            loadingText="Granting..."
                            onClick={() => onTogglePermission(employee, perm.key)}
                            style={{
                              padding: "6px 14px",
                              borderRadius: "6px",
                              fontSize: "12px",
                              fontWeight: 750,
                              border: "1px solid var(--success-border)",
                              background: "var(--success-bg)",
                              color: "var(--success)",
                            }}
                            onMouseEnter={(e) => {
                              if (pendingPermissionKey !== perm.key) {
                                e.currentTarget.style.background = "var(--success)";
                                e.currentTarget.style.color = "var(--on-primary)";
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (pendingPermissionKey !== perm.key) {
                                e.currentTarget.style.background = "var(--success-bg)";
                                e.currentTarget.style.color = "var(--success)";
                              }
                            }}
                          >
                            Grant Access
                          </ActionButton>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: TEAMS / SQUADS */}
          {activeTab === "teams" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                Assign staff member to functional squads. Squad membership automatically inherits group permissions.
              </span>

              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "10px" }}>
                {teams.map((t) => {
                  const isAssigned = (employee.teams || []).includes(t.name);
                  return (
                    <div
                      key={t.id}
                      style={{
                        padding: "14px",
                        borderRadius: "10px",
                        background: isAssigned ? "var(--surface-elevated)" : "var(--surface-2)",
                        border: `1px solid ${isAssigned ? "var(--primary-border)" : "var(--border)"}`,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <div style={{ fontSize: "14px", fontWeight: 750, color: "var(--text)" }}>{t.name}</div>
                        <div style={{ fontSize: "11.5px", color: "var(--muted)" }}>{t.description || "No description provided"}</div>
                        <div style={{ fontSize: "11px", color: "var(--primary)", marginTop: "2px" }}>
                          Includes {t.permissions?.length || 0} permissions
                        </div>
                      </div>

                      <ActionButton
                        loading={pendingTeamName === t.name}
                        loadingText={isAssigned ? "Removing..." : "Adding..."}
                        onClick={() => onToggleTeam(employee, t.name)}
                        style={{
                          padding: "6px 14px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: 750,
                          border: isAssigned ? "1px solid var(--primary-border)" : "1px solid var(--border)",
                          background: isAssigned ? "var(--primary)" : "var(--surface)",
                          color: isAssigned ? "var(--on-primary)" : "var(--text)",
                        }}
                      >
                        {isAssigned ? "Assigned ✓" : "+ Add to Squad"}
                      </ActionButton>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: SETTINGS & SECURITY */}
          {activeTab === "security" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className={adminStyles.drawerSection}>
                <p className={adminStyles.drawerSectionTitle}>Account Identity</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                    <span style={{ color: "var(--muted)" }}>Console Role</span>
                    <span style={{ fontWeight: 700, color: "var(--text)" }}>{employee.role || "EMPLOYEE"}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                    <span style={{ color: "var(--muted)" }}>Status</span>
                    <span style={{ fontWeight: 700, color: employee.enabled ? "var(--success)" : "var(--danger)" }}>
                      {employee.enabled ? "Operational" : "Disabled / Suspended"}
                    </span>
                  </div>
                </div>
              </div>

              {employee.enabled ? (
                <div
                  style={{
                    background: "var(--danger-bg)",
                    border: "1px solid var(--danger-border)",
                    borderRadius: "12px",
                    padding: "18px 20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Icon name="security" style={{ color: "var(--danger)", fontSize: "18px" }} />
                    <span style={{ fontSize: "13px", fontWeight: 800, color: "var(--danger)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Account Suspension & Access Control
                    </span>
                  </div>

                  <p style={{ fontSize: "12px", color: "var(--muted)", margin: 0, lineHeight: 1.5 }}>
                    Deactivating this staff member will immediately:
                  </p>

                  <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "12px", color: "var(--muted)", display: "flex", flexDirection: "column", gap: "4px" }}>
                    <li>Revoke all active console sessions and JWT tokens</li>
                    <li>Freeze direct authorities and squad access</li>
                    <li>Retain all historical audit logs for compliance</li>
                  </ul>

                  <ActionButton
                    iconName="person_off"
                    loading={isDeactivating}
                    loadingText="Deactivating..."
                    onClick={() => onDeactivate(employee.id, employee.email)}
                    style={{
                      marginTop: "6px",
                      width: "100%",
                      padding: "10px 16px",
                      borderRadius: "8px",
                      border: "1px solid var(--danger)",
                      background: "var(--danger)",
                      color: "var(--clr-white-a95)",
                      fontWeight: 750,
                      fontSize: "13px",
                    }}
                  >
                    Deactivate Staff Account
                  </ActionButton>
                </div>
              ) : (
                <div
                  style={{
                    background: "var(--surface-2)",
                    border: "1px solid var(--border)",
                    borderRadius: "12px",
                    padding: "16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <Icon name="block" style={{ color: "var(--danger)", fontSize: "20px" }} />
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 750, color: "var(--text)" }}>Account is currently deactivated</div>
                    <div style={{ fontSize: "11.5px", color: "var(--muted)" }}>This staff member cannot log in or perform system operations.</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
