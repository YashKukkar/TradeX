import { useState } from "react";
import { useToast } from "../context/ToastContext";
import { useCreateEmployee } from "./useAdmin";

export function useEmployeeCreation() {
  const { showToast } = useToast();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);

  const createEmployeeMutation = useCreateEmployee({
    onSuccess: () => {
      showToast("Employee account created successfully!", "success");
      setShowCreateModal(false);
      resetEmployeeForm();
    },
    onError: (err) => showToast(err.message || "Failed to create employee.", "error"),
  });

  const resetEmployeeForm = () => {
    setNewEmail("");
    setNewPassword("");
    setSelectedPermissions([]);
    setSelectedTeams([]);
  };

  const handleCreateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newPassword.trim()) {
      showToast("Email and password are required.", "error");
      return;
    }
    createEmployeeMutation.mutate({
      email: newEmail.trim(),
      password: newPassword.trim(),
      permissions: selectedPermissions,
      teams: selectedTeams,
    });
  };

  const handleToggleCreateTeam = (tName: string) => {
    setSelectedTeams((prev) =>
      prev.includes(tName) ? prev.filter((t) => t !== tName) : [...prev, tName]
    );
  };

  const handleToggleCreatePermission = (perm: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  return {
    showCreateModal,
    newEmail,
    newPassword,
    selectedPermissions,
    selectedTeams,
    isPending: createEmployeeMutation.isPending,
    setNewEmail,
    setNewPassword,
    setShowCreateModal,
    handleCreateEmployee,
    handleToggleCreateTeam,
    handleToggleCreatePermission,
    resetEmployeeForm,
  };
}
