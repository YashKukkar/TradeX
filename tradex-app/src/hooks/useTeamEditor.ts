import { useState } from "react";
import { useToast } from "../context/ToastContext";
import { useUpdateTeam } from "./useAdmin";
import type { TeamData } from "./useAdmin";

export function useTeamEditor() {
  const { showToast } = useToast();
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState<TeamData | null>(null);
  const [teamName, setTeamName] = useState("");
  const [teamDesc, setTeamDesc] = useState("");
  const [teamPermissions, setTeamPermissions] = useState<string[]>([]);

  const updateTeamMutation = useUpdateTeam({
    onSuccess: () => {
      showToast("Team updated successfully!", "success");
      setShowTeamModal(false);
      resetTeamForm();
    },
    onError: (err) => showToast(err.message || "Failed to update team.", "error"),
  });

  const resetTeamForm = () => {
    setEditingTeam(null);
    setTeamName("");
    setTeamDesc("");
    setTeamPermissions([]);
  };

  const handleSaveTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) {
      showToast("Team name is required.", "error");
      return;
    }
    if (editingTeam) {
      updateTeamMutation.mutate({
        id: editingTeam.id,
        name: teamName.trim(),
        description: teamDesc.trim(),
        permissions: teamPermissions,
      });
    }
  };

  const openEditTeamModal = (team: TeamData) => {
    setEditingTeam(team);
    setTeamName(team.name);
    setTeamDesc(team.description || "");
    setTeamPermissions(team.permissions || []);
    setShowTeamModal(true);
  };

  const handleToggleTeamPermission = (perm: string) => {
    setTeamPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  return {
    showTeamModal,
    editingTeam,
    teamName,
    teamDesc,
    teamPermissions,
    isPending: updateTeamMutation.isPending,
    setTeamName,
    setTeamDesc,
    setShowTeamModal,
    openEditTeamModal,
    handleSaveTeam,
    handleToggleTeamPermission,
  };
}
