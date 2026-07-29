import React from "react";
import Modal from "./Modal";
import styles from "./EmployeeManagement.module.css";
import type { TeamData, PermissionRegistryData } from "../hooks/useAdmin";

interface CreateEmployeeModalProps {
  isOpen: boolean;
  isPending: boolean;
  newEmail: string;
  setNewEmail: (email: string) => void;
  newPassword: string;
  setNewPassword: (password: string) => void;
  availableTeams: TeamData[];
  selectedTeams: string[];
  onToggleTeam: (teamName: string) => void;
  systemPermissions: PermissionRegistryData[];
  selectedPermissions: string[];
  onTogglePermission: (perm: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export default function CreateEmployeeModal({
  isOpen,
  isPending,
  newEmail,
  setNewEmail,
  newPassword,
  setNewPassword,
  availableTeams,
  selectedTeams,
  onToggleTeam,
  systemPermissions,
  selectedPermissions,
  onTogglePermission,
  onSubmit,
  onClose,
}: CreateEmployeeModalProps) {
  // Real-time calculation of effective permissions
  const inheritedPermissions = Array.from(
    new Set(
      selectedTeams.flatMap((tName) => {
        const team = availableTeams.find((t) => t.name === tName);
        return team ? team.permissions : [];
      })
    )
  );

  const effectivePermissions = Array.from(
    new Set([...selectedPermissions, ...inheritedPermissions])
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Employee">
      <form onSubmit={onSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Email Address</label>
          <input
            type="email"
            required
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="employee@tradex.com"
            className={styles.input}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Password</label>
          <input
            type="password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="At least 8 characters"
            minLength={8}
            className={styles.input}
          />
        </div>

        {/* Option A: Assign to Teams */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Assign to Teams (Group Permissions)</label>
          <div className={styles.checkboxContainer}>
            {availableTeams.length === 0 ? (
              <span className={styles.emptyText}>No teams defined in the system.</span>
            ) : (
              availableTeams.map((team) => (
                <label key={team.id} className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={selectedTeams.includes(team.name)}
                    onChange={() => onToggleTeam(team.name)}
                    className={styles.checkbox}
                  />
                  <strong>{team.name}</strong> <span style={{ fontSize: "0.85em", color: "#888" }}>({team.description})</span>
                </label>
              ))
            )}
          </div>
        </div>

        {/* Option B: Direct Permissions */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Direct Authorities (Individual Override)</label>
          <div className={styles.checkboxContainer}>
            {systemPermissions.map((perm) => (
              <label key={perm.key} className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={selectedPermissions.includes(perm.key)}
                  onChange={() => onTogglePermission(perm.key)}
                  className={styles.checkbox}
                />
                <strong>{perm.displayName}</strong> <span style={{ fontSize: "0.85em", color: "#888" }}>- {perm.description}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Live calculated effective permissions */}
        <div className={styles.formGroup} style={{ backgroundColor: "#f9f9fb", padding: "12px", borderRadius: "6px", border: "1px solid #eef" }}>
          <label className={styles.label} style={{ marginBottom: "6px" }}>Calculated Effective Permissions Preview</label>
          {effectivePermissions.length === 0 ? (
            <span style={{ fontSize: "0.9em", color: "#999", fontStyle: "italic" }}>No permissions will be granted yet.</span>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "4px" }}>
              {effectivePermissions.map((permKey) => {
                const isDirect = selectedPermissions.includes(permKey);
                const isInherited = inheritedPermissions.includes(permKey);
                const metadata = systemPermissions.find((p) => p.key === permKey);
                const label = metadata ? metadata.displayName : permKey;

                return (
                  <span
                    key={permKey}
                    style={{
                      fontSize: "0.8em",
                      backgroundColor: "#e3f2fd",
                      color: "#0d47a1",
                      padding: "3px 8px",
                      borderRadius: "12px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      border: "1px solid #bbdefb",
                    }}
                  >
                    {label}
                    {isInherited && <span title="Inherited from Team" style={{ cursor: "help" }}>🛡️</span>}
                    {isDirect && <span title="Directly Assigned Override" style={{ cursor: "help" }}>👤</span>}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        <button type="submit" disabled={isPending} className={styles.submitBtn}>
          {isPending ? "Creating Account..." : "Create Employee Account"}
        </button>
      </form>
    </Modal>
  );
}
