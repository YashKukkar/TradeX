import { useState } from "react";
import Icon from "./Icon";
import Toast from "./Toast";
import adminStyles from "../AdminUsers.module.css";
import styles from "./EmployeeManagement.module.css";
import Modal from "./Modal";
import {
  useEmployees,
  useCreateEmployee,
  useUpdateEmployeePermissions,
  useDeleteEmployee,
} from "../hooks/useAdmin";
import { ALL_PERMISSIONS, PERMISSION_LABELS, type PermissionKey } from "../utils/permissions";
import type { UserInfo } from "../utils/dashboardHelpers";

export default function EmployeeManagement() {
  const { data: employees = [], isLoading, isError } = useEmployees();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Form states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<PermissionKey[]>([]);

  // Edit states
  const [editingEmployee, setEditingEmployee] = useState<UserInfo | null>(null);
  const [editPermissions, setEditPermissions] = useState<PermissionKey[]>([]);

  // Mutations
  const createMutation = useCreateEmployee({
    onSuccess: () => {
      setToast({ message: "Employee account created successfully!", type: "success" });
      setShowCreateModal(false);
      resetForm();
    },
    onError: (err) => {
      setToast({ message: err.message || "Failed to create employee.", type: "error" });
    },
  });

  const updatePermissionsMutation = useUpdateEmployeePermissions({
    onSuccess: () => {
      setToast({ message: "Employee permissions updated successfully!", type: "success" });
      setEditingEmployee(null);
    },
    onError: (err) => {
      setToast({ message: err.message || "Failed to update permissions.", type: "error" });
    },
  });

  const deleteMutation = useDeleteEmployee({
    onSuccess: () => {
      setToast({ message: "Employee account deactivated successfully!", type: "success" });
    },
    onError: (err) => {
      setToast({ message: err.message || "Failed to deactivate employee.", type: "error" });
    },
  });

  const resetForm = () => {
    setNewEmail("");
    setNewPassword("");
    setSelectedPermissions([]);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newPassword.trim()) {
      setToast({ message: "Email and password are required.", type: "error" });
      return;
    }
    createMutation.mutate({
      email: newEmail.trim(),
      password: newPassword.trim(),
      permissions: selectedPermissions,
    });
  };

  const handlePermissionToggle = (perm: PermissionKey, isEdit: boolean) => {
    if (isEdit) {
      setEditPermissions((prev) =>
        prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
      );
    } else {
      setSelectedPermissions((prev) =>
        prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
      );
    }
  };

  const openEditModal = (emp: UserInfo) => {
    setEditingEmployee(emp);
    setEditPermissions((emp.permissions || []) as PermissionKey[]);
  };

  const handleUpdatePermissions = () => {
    if (!editingEmployee) return;
    updatePermissionsMutation.mutate({
      employeeId: editingEmployee.id,
      permissions: editPermissions,
    });
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Are you sure you want to deactivate this employee account?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className={adminStyles.tableSection} style={{ marginTop: "32px" }}>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className={styles.headerRow}>
        <div>
          <h2 className={adminStyles.tableTitle} style={{ margin: 0 }}>Employee Management</h2>
          <p className={styles.subTitle}>
            Create and delegate system authorities to platform employees.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            resetForm();
            setShowCreateModal(true);
          }}
          className={styles.addBtn}
        >
          <Icon name="person_add" style={{ fontSize: "18px" }} />
          Add Employee
        </button>
      </div>

      {isLoading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "var(--muted)" }}>
          Loading employees telemetry...
        </div>
      ) : isError ? (
        <div style={{ padding: "40px", textAlign: "center", color: "var(--danger)" }}>
          Failed to load employees.
        </div>
      ) : employees.length === 0 ? (
        <div className={styles.emptyState}>
          <Icon name="badge" className={styles.emptyIcon} />
          <p className={styles.emptyTitle}>No Employees Registered</p>
          <p className={styles.emptySub}>Create one above to delegate work.</p>
        </div>
      ) : (
        <div className={adminStyles.tableContainer}>
          <table className={adminStyles.table}>
            <thead>
              <tr>
                <th>Employee Account</th>
                <th>Authorities / Permissions</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id}>
                  <td>
                    <div className={styles.employeeMeta}>
                      <span className={styles.employeeEmail}>{emp.email}</span>
                      <span className={styles.employeeSubtext}>
                        ID: #{emp.id} &bull; Created: {emp.createdAt ? new Date(emp.createdAt * 1000).toLocaleDateString() : "N/A"}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className={styles.permissionsList}>
                      {emp.permissions && emp.permissions.length > 0 ? (
                        emp.permissions.map((p) => (
                          <span key={p} className={styles.permissionTag}>
                            {PERMISSION_LABELS[p as PermissionKey] || p}
                          </span>
                        ))
                      ) : (
                        <span style={{ fontSize: "11.5px", color: "var(--muted)", fontStyle: "italic" }}>
                          No access assigned
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span
                      className={`${styles.statusPill} ${
                        emp.enabled ? styles.statusActive : styles.statusDisabled
                      }`}
                    >
                      {emp.enabled ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div className={styles.actionRow}>
                      <button
                        className={adminStyles.approveBtn}
                        onClick={() => openEditModal(emp)}
                        disabled={!emp.enabled}
                        style={{ padding: "6px 12px", gap: "4px", fontSize: "12.5px" }}
                      >
                        <Icon name="shield_lock" style={{ fontSize: "16px" }} />
                        Permissions
                      </button>
                      {emp.enabled && (
                        <button
                          className={adminStyles.rejectBtn}
                          onClick={() => handleDelete(emp.id)}
                          style={{ padding: "6px 12px", gap: "4px", fontSize: "12.5px" }}
                        >
                          <Icon name="block" style={{ fontSize: "16px" }} />
                          Deactivate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE EMPLOYEE MODAL */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add New Employee"
      >
        <form onSubmit={handleCreateSubmit} className={styles.form}>
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

          <div className={styles.formGroup}>
            <label className={styles.label}>Delegate Authorities</label>
            <div className={styles.checkboxContainer}>
              {ALL_PERMISSIONS.map((perm) => (
                <label key={perm} className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={selectedPermissions.includes(perm)}
                    onChange={() => handlePermissionToggle(perm, false)}
                    className={styles.checkbox}
                  />
                  {PERMISSION_LABELS[perm]}
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={createMutation.isPending}
            className={styles.submitBtn}
          >
            {createMutation.isPending ? "Creating Employee Account..." : "Create Employee Account"}
          </button>
        </form>
      </Modal>

      {/* EDIT PERMISSIONS MODAL */}
      <Modal
        isOpen={!!editingEmployee}
        onClose={() => setEditingEmployee(null)}
        title="Update Authorities"
        subtitle={editingEmployee ? `Modifying authorities for employee: ${editingEmployee.email}` : ""}
      >
        <div className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Delegate Authorities</label>
            <div className={styles.checkboxContainer}>
              {ALL_PERMISSIONS.map((perm) => (
                <label key={perm} className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={editPermissions.includes(perm)}
                    onChange={() => handlePermissionToggle(perm, true)}
                    className={styles.checkbox}
                  />
                  {PERMISSION_LABELS[perm]}
                </label>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleUpdatePermissions}
            disabled={updatePermissionsMutation.isPending}
            className={styles.submitBtn}
          >
            {updatePermissionsMutation.isPending ? "Saving Authorities..." : "Save Authorities"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
