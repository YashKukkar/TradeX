import { useState, useMemo } from "react";
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

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);

  const selectedEmployee = useMemo(() => {
    if (!selectedEmployeeId) return null;
    return employees.find((e) => e.id === selectedEmployeeId) || null;
  }, [employees, selectedEmployeeId]);

  const liveEmployee = selectedEmployee;

  const setSelectedEmployee = (emp: UserInfo | null) => {
    setSelectedEmployeeId(emp ? emp.id : null);
  };

  const [pendingPermissionKey, setPendingPermissionKey] = useState<string | null>(null);
  const [pendingTeamName, setPendingTeamName] = useState<string | null>(null);

  const updatePermissionsMutation = useUpdateEmployeePermissions({
    onSuccess: () => {
      showToast("Employee permissions updated!", "success");
      setPendingPermissionKey(null);
    },
    onError: (err) => {
      showToast(err.message || "Failed to update permissions.", "error");
      setPendingPermissionKey(null);
    },
  });

  const deleteEmployeeMutation = useDeleteEmployee({
    onSuccess: () => {
      showToast("Employee deactivated!", "success");
      setSelectedEmployeeId(null);
    },
    onError: (err) => showToast(err.message || "Failed to deactivate employee.", "error"),
  });

  const updateEmployeeTeamsMutation = useUpdateEmployeeTeams({
    onSuccess: () => {
      showToast("Employee team assignment updated!", "success");
      setPendingTeamName(null);
    },
    onError: (err) => {
      showToast(err.message || "Failed to update employee teams.", "error");
      setPendingTeamName(null);
    },
  });

  const toggleEmployeeTeam = (emp: UserInfo, tName: string) => {
    setPendingTeamName(tName);
    const latestEmp = employees.find((e) => e.id === emp.id) || emp;
    const currentTeams = latestEmp.teams || [];
    const nextTeams = currentTeams.includes(tName)
      ? currentTeams.filter((t) => t !== tName)
      : [...currentTeams, tName];
    
    updateEmployeeTeamsMutation.mutate({ employeeId: latestEmp.id, teams: nextTeams });
  };

  const toggleEmployeePermission = (emp: UserInfo, perm: string) => {
    setPendingPermissionKey(perm);
    const latestEmp = employees.find((e) => e.id === emp.id) || emp;
    const currentPerms = latestEmp.permissions || [];
    const nextPerms = currentPerms.includes(perm)
      ? currentPerms.filter((p) => p !== perm)
      : [...currentPerms, perm];

    updatePermissionsMutation.mutate({ employeeId: latestEmp.id, permissions: nextPerms });
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
    pendingPermissionKey,
    pendingTeamName,
    isDeactivating: deleteEmployeeMutation.isPending,
  };
}
