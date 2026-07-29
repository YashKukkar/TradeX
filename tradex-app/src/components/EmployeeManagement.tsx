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

  return (
    <div className={adminStyles.tableSection} style={{ marginTop: "16px" }}>

      {/* Header bar with unified tab buttons */}
      <div className={adminStyles.tableHeader}>
        <div>
          <h2 className={adminStyles.tableTitle}>Employee Management Console</h2>
          <span style={{ fontSize: "12px", color: "var(--muted)" }}>
            Delegate system authorities, assign functional teams, and manage staff operations.
          </span>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <div className={styles.subTabBar}>
            <button
              onClick={() => setActiveSubPanel("directory")}
              className={`${styles.subTabBtn} ${activeSubPanel === "directory" ? styles.subTabBtnActive : ""}`}
            >
              <Icon name="badge" style={{ fontSize: "14px" }} />
              Staff Directory
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
            <button
              type="button"
              onClick={() => {
                resetEmployeeForm();
                setShowCreateModal(true);
              }}
              className={styles.addBtn}
            >
              <Icon name="person_add" style={{ fontSize: "16px" }} />
              Add Employee
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
