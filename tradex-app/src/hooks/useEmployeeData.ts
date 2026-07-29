import { useState } from "react";
import { useToast } from "../context/ToastContext";
import {
  useEmployees,
  useSystemPermissions,
  useTeams,
  useUpdateEmployeePermissions,
  useDeleteEmployee,
  useUpdateEmployeeTeams,
} from "./useAdmin";
import type { UserInfo } from "../utils/dashboardHelpers";

export function useEmployeeData() {
  const { data: employees = [], isLoading, isError } = useEmployees();
  const { data: systemPermissions = [] } = useSystemPermissions();
  const { data: teams = [] } = useTeams();
  const { showToast } = useToast();

  const [selectedEmployee, setSelectedEmployee] = useState<UserInfo | null>(null);

  const liveEmployee = selectedEmployee
    ? employees.find((e) => e.id === selectedEmployee.id) || selectedEmployee
    : null;

  const updatePermissionsMutation = useUpdateEmployeePermissions({
    onSuccess: () => showToast("Employee permissions updated!", "success"),
    onError: (err) => showToast(err.message || "Failed to update permissions.", "error"),
  });

  const deleteEmployeeMutation = useDeleteEmployee({
    onSuccess: () => {
      showToast("Employee deactivated!", "success");
      setSelectedEmployee(null);
    },
    onError: (err) => showToast(err.message || "Failed to deactivate employee.", "error"),
  });

  const updateEmployeeTeamsMutation = useUpdateEmployeeTeams({
    onSuccess: () => showToast("Employee team assignment updated!", "success"),
    onError: (err) => showToast(err.message || "Failed to update employee teams.", "error"),
  });

  const toggleEmployeeTeam = (emp: UserInfo, tName: string) => {
    const currentTeams = emp.teams || [];
    const nextTeams = currentTeams.includes(tName)
      ? currentTeams.filter((t) => t !== tName)
      : [...currentTeams, tName];
    
    updateEmployeeTeamsMutation.mutate({ employeeId: emp.id, teams: nextTeams });
    setSelectedEmployee({ ...emp, teams: nextTeams });
  };

  const toggleEmployeePermission = (emp: UserInfo, perm: string) => {
    const currentPerms = emp.permissions || [];
    const nextPerms = currentPerms.includes(perm)
      ? currentPerms.filter((p) => p !== perm)
      : [...currentPerms, perm];

    updatePermissionsMutation.mutate({ employeeId: emp.id, permissions: nextPerms });
    setSelectedEmployee({ ...emp, permissions: nextPerms });
  };

  const getPermissionLabel = (permKey: string) => {
    const perm = systemPermissions.find((p) => p.key === permKey);
    return perm ? perm.displayName : permKey.replace(/_/g, " ");
  };

  return {
    employees,
    systemPermissions,
    teams,
    selectedEmployee,
    setSelectedEmployee,
    liveEmployee,
    isLoading,
    isError,
    deleteEmployeeMutation,
    toggleEmployeeTeam,
    toggleEmployeePermission,
    getPermissionLabel,
  };
}
