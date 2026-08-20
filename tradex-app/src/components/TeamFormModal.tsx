import React from "react";
import Modal from "./Modal";
import styles from "./EmployeeManagement.module.css";
import type { TeamData, PermissionRegistryData } from "../hooks/useAdmin";

interface TeamFormModalProps {
  isOpen: boolean;
  isPending: boolean;
  editingTeam: TeamData | null;
  teamName: string;
  setTeamName: (name: string) => void;
  teamDesc: string;
  setTeamDesc: (desc: string) => void;
  teamPermissions: string[];
  systemPermissions: PermissionRegistryData[];
  onTogglePermission: (perm: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export default function TeamFormModal({
  isOpen,
  isPending,
  editingTeam,
  teamName,
  setTeamName,
  teamDesc,
  setTeamDesc,
  teamPermissions,
  systemPermissions,
  onTogglePermission,
  onSubmit,
  onClose,
}: TeamFormModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingTeam ? "Edit Team" : "Create New Team"}
    >
      <form onSubmit={onSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Team Name</label>
          <input
            type="text"
            required
            disabled={!!editingTeam}
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="e.g. Support Operations"
            className={styles.input}
            style={editingTeam ? { backgroundColor: "var(--surface-recessed)", cursor: "not-allowed" } : undefined}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Description</label>
          <input
            type="text"
            value={teamDesc}
            onChange={(e) => setTeamDesc(e.target.value)}
            placeholder="Brief overview of team responsibilities"
            className={styles.input}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Mapped System Permissions</label>
          <div className={styles.checkboxContainer}>
            {systemPermissions.map((perm) => (
              <label key={perm.key} className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={teamPermissions.includes(perm.key)}
                  onChange={() => onTogglePermission(perm.key)}
                  className={styles.checkbox}
                />
                <div>
                  <strong>{perm.displayName}</strong>
                  <span style={{ fontSize: "11px", color: "var(--muted)", display: "block" }}>
                    {perm.description}
                  </span>
                </div>
              </label>
            ))}
          </div>
        </div>

        <button type="submit" disabled={isPending} className={styles.submitBtn}>
          {editingTeam ? "Save Team Changes" : "Create Team"}
        </button>
      </form>
    </Modal>
  );
}
