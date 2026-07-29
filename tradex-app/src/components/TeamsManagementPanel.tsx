import Icon from "./Icon";
import styles from "./EmployeeManagement.module.css";
import type { TeamData, PermissionRegistryData } from "../hooks/useAdmin";

interface TeamsManagementPanelProps {
  teams: TeamData[];
  systemPermissions: PermissionRegistryData[];
  onOpenEditTeam: (team: TeamData) => void;
}

export default function TeamsManagementPanel({
  teams,
  systemPermissions,
  onOpenEditTeam,
}: TeamsManagementPanelProps) {
  const getPermissionLabel = (permKey: string) => {
    const perm = systemPermissions.find((p) => p.key === permKey);
    return perm ? perm.displayName : permKey;
  };

  return (
    <div style={{ padding: "20px" }}>
      {/* Teams Cards Grid */}
      <div className={styles.teamsGrid}>
        {teams.map((team) => (
          <div key={team.id} className={styles.teamCard}>
            <div>
              <div className={styles.teamHeader}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Icon name="groups" style={{ fontSize: "20px", color: "var(--primary)" }} />
                  <h3 className={styles.teamTitle}>{team.name}</h3>
                </div>
                <div style={{ display: "flex", gap: "4px" }}>
                  <button
                    onClick={() => onOpenEditTeam(team)}
                    className={styles.iconBtn}
                    title="Configure Team Permissions"
                  >
                    <Icon name="edit" style={{ fontSize: "16px" }} />
                  </button>
                </div>
              </div>
              <p className={styles.teamDesc}>{team.description || "No description provided."}</p>

              <div className={styles.teamPermSection}>
                <span className={styles.teamPermHeader}>MAPPED SYSTEM PERMISSIONS</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                  {team.permissions && team.permissions.length > 0 ? (
                    team.permissions.map((p) => (
                      <span key={p} className={styles.permTag}>
                        {getPermissionLabel(p)}
                      </span>
                    ))
                  ) : (
                    <span className={styles.noTeamTag}>No permissions assigned (Default Unassigned)</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
