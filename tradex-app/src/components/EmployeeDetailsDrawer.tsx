import Icon from "./Icon";
import adminStyles from "../AdminUsers.module.css";
import styles from "./EmployeeManagement.module.css";
import type { TeamData, PermissionRegistryData } from "../hooks/useAdmin";
import type { UserInfo } from "../utils/dashboardHelpers";
import { useRegisterOverlay } from "../context/OverlayContext";

interface EmployeeDetailsDrawerProps {
  employee: UserInfo;
  teams: TeamData[];
  systemPermissions: PermissionRegistryData[];
  onClose: () => void;
  onToggleTeam: (emp: UserInfo, teamName: string) => void;
  onTogglePermission: (emp: UserInfo, perm: string) => void;
  onDeactivate: (empId: number, email: string) => void;
}

export default function EmployeeDetailsDrawer({
  employee,
  teams,
  systemPermissions,
  onClose,
  onToggleTeam,
  onTogglePermission,
  onDeactivate,
}: EmployeeDetailsDrawerProps) {
  useRegisterOverlay("employee-drawer", true);
  // Calculate inherited permissions with metadata on source teams
  const inheritanceSources = (employee.teams || []).reduce((acc, tName) => {
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

  const inheritedPermissions = Object.keys(inheritanceSources);

  return (
    <>
      <div className={adminStyles.drawerBackdrop} onClick={onClose} />
      <aside className={adminStyles.drawerContainer} style={{ width: "450px" }}>
        <div className={adminStyles.drawerHeader}>
          <div>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800 }}>Employee Details</h3>
            <span style={{ fontSize: "12px", color: "var(--muted)" }}>{employee.email}</span>
          </div>
          <button className={adminStyles.drawerCloseBtn} onClick={onClose}>
            <Icon name="close" style={{ fontSize: "18px" }} />
          </button>
        </div>

        <div className={adminStyles.drawerContent} style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "20px", overflowY: "auto" }}>
          {/* Account Meta */}
          <div className={adminStyles.drawerSection}>
            <p className={adminStyles.drawerSectionTitle}>Account Overview</p>
            <div className={adminStyles.drawerRow}>
              <span className={adminStyles.drawerLabel}>Account ID</span>
              <span className={adminStyles.drawerValue}>#{employee.id}</span>
            </div>
            <div className={adminStyles.drawerRow}>
              <span className={adminStyles.drawerLabel}>Role</span>
              <span className={adminStyles.drawerValue}>{employee.role}</span>
            </div>
            <div className={adminStyles.drawerRow}>
              <span className={adminStyles.drawerLabel}>Status</span>
              <span className={`${styles.statusPill} ${employee.enabled ? styles.statusActive : styles.statusDisabled}`} style={{ fontSize: "11px" }}>
                {employee.enabled ? "Active" : "Disabled"}
              </span>
            </div>
          </div>

          {/* Team Assignments */}
          <div className={adminStyles.drawerSection}>
            <p className={adminStyles.drawerSectionTitle}>Assigned Teams (Groups)</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {teams.length === 0 ? (
                <span style={{ fontSize: "12px", color: "var(--muted)", fontStyle: "italic" }}>No teams available in system.</span>
              ) : (
                teams.map((t) => {
                  const isAssigned = employee.teams?.includes(t.name);
                  return (
                    <label key={t.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg)", padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--border)", cursor: "pointer" }}>
                      <div>
                        <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>{t.name}</span>
                        <span style={{ fontSize: "11px", color: "var(--muted)", display: "block" }}>{t.permissions?.length || 0} permissions inherited</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={!!isAssigned}
                        onChange={() => onToggleTeam(employee, t.name)}
                      />
                    </label>
                  );
                })
              )}
            </div>
          </div>

          {/* Direct Authorities Toggle */}
          <div className={adminStyles.drawerSection}>
            <p className={adminStyles.drawerSectionTitle}>Direct Override Authorities</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {systemPermissions.map((perm) => {
                const isChecked = employee.permissions?.includes(perm.key);
                const isInherited = inheritedPermissions.includes(perm.key);
                return (
                  <label key={perm.key} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "8px", fontSize: "12.5px", background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: "6px", cursor: "pointer", opacity: isInherited ? 0.75 : 1 }}>
                    <div style={{ marginRight: "10px" }}>
                      <span style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
                        {perm.displayName}
                        {isInherited && (
                          <span
                            title={`Inherited from Team: ${inheritanceSources[perm.key].join(", ")}`}
                            style={{ cursor: "help", fontSize: "0.85em", backgroundColor: "#e3f2fd", color: "#0d47a1", padding: "1px 6px", borderRadius: "8px" }}
                          >
                            🛡️ {inheritanceSources[perm.key].join(", ")}
                          </span>
                        )}
                      </span>
                      <span style={{ fontSize: "11px", color: "var(--muted)", display: "block", marginTop: "2px" }}>{perm.description}</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={!!isChecked}
                      onChange={() => onTogglePermission(employee, perm.key)}
                      style={{ marginTop: "4px" }}
                    />
                  </label>
                );
              })}
            </div>
          </div>

          {/* Deactivate Action */}
          {employee.enabled && (
            <button
              onClick={() => onDeactivate(employee.id, employee.email)}
              className={adminStyles.rejectBtn}
              style={{ width: "100%", justifyContent: "center", marginTop: "10px" }}
            >
              <Icon name="block" style={{ fontSize: "16px" }} />
              Deactivate Employee Account
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
