import { useState } from "react";
import Icon from "./Icon";
import adminStyles from "../AdminUsers.module.css";
import styles from "./EmployeeManagement.module.css";
import StaffDirectoryTable from "./StaffDirectoryTable";
import EmployeeDetailsDrawer from "./EmployeeDetailsDrawer";
import TeamsManagementPanel from "./TeamsManagementPanel";
import CreateEmployeeModal from "./CreateEmployeeModal";
import TeamFormModal from "./TeamFormModal";
import { useEmployeeData } from "../hooks/useEmployeeData";
import { useEmployeeCreation } from "../hooks/useEmployeeCreation";
import { useTeamEditor } from "../hooks/useTeamEditor";

import { downloadCsv, generateCsvFilename, formatDate } from "../utils/formatters";

export default function EmployeeManagement() {
  const [activeSubPanel, setActiveSubPanel] = useState<"directory" | "teams">("directory");

  const {
    employees,
    systemPermissions,
    teams,
    setSelectedEmployee,
    liveEmployee,
    isLoading,
    isError,
    deleteEmployeeMutation,
    toggleEmployeeTeam,
    toggleEmployeePermission,
    getPermissionLabel,
    pendingPermissionKey,
    pendingTeamName,
    isDeactivating,
  } = useEmployeeData();

  const {
    showCreateModal,
    newEmail,
    newPassword,
    selectedPermissions,
    selectedTeams,
    isPending: isCreatePending,
    setNewEmail,
    setNewPassword,
    setShowCreateModal,
    handleCreateEmployee,
    handleToggleCreateTeam,
    handleToggleCreatePermission,
    resetEmployeeForm,
  } = useEmployeeCreation();

  const {
    showTeamModal,
    editingTeam,
    teamName,
    teamDesc,
    teamPermissions,
    isPending: isTeamPending,
    setTeamName,
    setTeamDesc,
    setShowTeamModal,
    openEditTeamModal,
    handleSaveTeam,
    handleToggleTeamPermission,
  } = useTeamEditor();

  const handleExportStaffCsv = () => {
    const headers = [
      "Staff ID",
      "Email",
      "Role",
      "Assigned Teams",
      "Authorities Count",
      "Authorities List",
      "Status",
      "Created Date",
    ];

    const rows = employees.map((emp) => [
      emp.id,
      emp.email,
      emp.role || "EMPLOYEE",
      (emp.teams || []).join("; ") || "None",
      (emp.permissions || []).length,
      (emp.permissions || []).join("; "),
      emp.locked ? "LOCKED" : emp.enabled === false ? "INACTIVE" : "ACTIVE",
      formatDate(emp.createdAt, true),
    ]);

    downloadCsv(generateCsvFilename("Staff_Directory"), headers, rows);
  };

  const handleExportTeamsCsv = () => {
    const headers = [
      "Team ID",
      "Squad Name",
      "Description",
      "Assigned Staff Count",
      "Permissions Count",
      "Permissions List",
    ];

    const rows = teams.map((team) => {
      const assignedCount = employees.filter((e) => (e.teams || []).includes(team.name)).length;
      return [
        team.id,
        team.name,
        team.description || "—",
        assignedCount,
        (team.permissions || []).length,
        (team.permissions || []).join("; "),
      ];
    });

    downloadCsv(generateCsvFilename("Functional_Squads"), headers, rows);
  };

  const superAdminCount = employees.filter((e) => e.role === "SUPER_ADMIN").length;
  const staffCount = employees.filter((e) => e.role !== "SUPER_ADMIN").length;

  return (
    <div className={adminStyles.tableSection} style={{ marginTop: "16px" }}>

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
            <span style={{ fontSize: "11.5px", color: "var(--muted)", fontWeight: 600, textTransform: "uppercase" }}>Total Staff</span>
            <Icon name="badge" style={{ fontSize: "16px", color: "var(--clr-indigo)" }} />
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
            <span style={{ fontSize: "20px", fontWeight: 800, color: "var(--text)" }}>{employees.length}</span>
            <span style={{ fontSize: "11px", color: "var(--muted)" }}>{staffCount} operators • {superAdminCount} super admins</span>
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
            <span style={{ fontSize: "11.5px", color: "var(--muted)", fontWeight: 600, textTransform: "uppercase" }}>Functional Teams</span>
            <Icon name="groups" style={{ fontSize: "16px", color: "var(--clr-indigo)" }} />
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
            <span style={{ fontSize: "20px", fontWeight: 800, color: "var(--clr-indigo)" }}>{teams.length}</span>
            <span style={{ fontSize: "11px", color: "var(--clr-indigo)", fontWeight: 700 }}>active squads</span>
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
            <span style={{ fontSize: "11.5px", color: "var(--muted)", fontWeight: 600, textTransform: "uppercase" }}>System Authorities</span>
            <Icon name="shield" style={{ fontSize: "16px", color: "var(--accent)" }} />
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
            <span style={{ fontSize: "20px", fontWeight: 800, color: "var(--accent)" }}>{systemPermissions.length}</span>
            <span style={{ fontSize: "11px", color: "var(--muted)" }}>granular permissions</span>
          </div>
        </div>
      </div>

      {/* Header bar with unified tab buttons */}
      <div className={adminStyles.tableHeader}>
        <div>
          <h2 className={adminStyles.tableTitle}>Staff & Team Management Console</h2>
          <span style={{ fontSize: "12px", color: "var(--muted)" }}>
            Delegate system authorities, assign functional teams, and manage staff operations.
          </span>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <div className={styles.subTabBar}>
            <button
              onClick={() => setActiveSubPanel("directory")}
              className={`${styles.subTabBtn} ${activeSubPanel === "directory" ? styles.subTabBtnActive : ""}`}
            >
              <Icon name="badge" style={{ fontSize: "14px" }} />
              Staff Directory ({employees.length})
            </button>
            <button
              onClick={() => setActiveSubPanel("teams")}
              className={`${styles.subTabBtn} ${activeSubPanel === "teams" ? styles.subTabBtnActive : ""}`}
            >
              <Icon name="groups" style={{ fontSize: "14px" }} />
              Teams Directory ({teams.length})
            </button>
          </div>

          {activeSubPanel === "directory" && (
            <>
              <button
                type="button"
                onClick={handleExportStaffCsv}
                disabled={employees.length === 0}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "7px 12px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: employees.length === 0 ? "not-allowed" : "pointer",
                  background: "var(--surface-2)",
                  color: "var(--text)",
                  border: "1px solid var(--border)",
                  transition: "all 0.2s ease",
                  height: "36px",
                }}
              >
                <Icon name="download" style={{ fontSize: "15px", color: "var(--clr-indigo)" }} />
                <span>Export CSV</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  resetEmployeeForm();
                  setShowCreateModal(true);
                }}
                className={styles.addBtn}
                style={{ background: "var(--clr-indigo)", color: "var(--on-primary)" }}
              >
                <Icon name="person_add" style={{ fontSize: "16px" }} />
                Add Staff Member
              </button>
            </>
          )}

          {activeSubPanel === "teams" && (
            <button
              type="button"
              onClick={handleExportTeamsCsv}
              disabled={teams.length === 0}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "7px 12px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 700,
                cursor: teams.length === 0 ? "not-allowed" : "pointer",
                background: "var(--surface-2)",
                color: "var(--text)",
                border: "1px solid var(--border)",
                transition: "all 0.2s ease",
                height: "36px",
              }}
            >
              <Icon name="download" style={{ fontSize: "15px", color: "var(--clr-indigo)" }} />
              <span>Export Teams CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* Panel Views */}
      {activeSubPanel === "directory" ? (
        <StaffDirectoryTable
          employees={employees}
          isLoading={isLoading}
          isError={isError}
          getPermissionLabel={getPermissionLabel}
          onSelectEmployee={setSelectedEmployee}
        />
      ) : (
        <TeamsManagementPanel
          teams={teams}
          systemPermissions={systemPermissions}
          onOpenEditTeam={openEditTeamModal}
        />
      )}

      {/* Employee Details Drawer */}
      {liveEmployee && (
        <EmployeeDetailsDrawer
          employee={liveEmployee}
          teams={teams}
          systemPermissions={systemPermissions}
          onClose={() => setSelectedEmployee(null)}
          onToggleTeam={toggleEmployeeTeam}
          onTogglePermission={toggleEmployeePermission}
          onDeactivate={(id, email) => {
            if (window.confirm(`Deactivate employee account ${email}?`)) deleteEmployeeMutation.mutate(id);
          }}
          pendingPermissionKey={pendingPermissionKey}
          pendingTeamName={pendingTeamName}
          isDeactivating={isDeactivating}
        />
      )}

      {/* Modal Dialogs */}
      <CreateEmployeeModal
        isOpen={showCreateModal}
        isPending={isCreatePending}
        newEmail={newEmail}
        setNewEmail={setNewEmail}
        newPassword={newPassword}
        setNewPassword={setNewPassword}
        availableTeams={teams}
        selectedTeams={selectedTeams}
        onToggleTeam={handleToggleCreateTeam}
        systemPermissions={systemPermissions}
        selectedPermissions={selectedPermissions}
        onTogglePermission={handleToggleCreatePermission}
        onSubmit={handleCreateEmployee}
        onClose={() => setShowCreateModal(false)}
      />

      <TeamFormModal
        isOpen={showTeamModal}
        isPending={isTeamPending}
        editingTeam={editingTeam}
        teamName={teamName}
        setTeamName={setTeamName}
        teamDesc={teamDesc}
        setTeamDesc={setTeamDesc}
        teamPermissions={teamPermissions}
        systemPermissions={systemPermissions}
        onTogglePermission={handleToggleTeamPermission}
        onSubmit={handleSaveTeam}
        onClose={() => setShowTeamModal(false)}
      />
    </div>
  );
}
