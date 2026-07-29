import { useState, useMemo, useEffect } from "react";
import { useToast } from "../context/ToastContext";
import { fuzzyMatch } from "../utils/fuzzyMatch";
import {
  usePendingTransactions,
  useAllTransactions,
  useApproveTransaction,
  useRejectTransaction,
} from "./useAdmin";

export function usePendingTransactionsState() {
  const [activeTab, setActiveTab] = useState<"pending" | "all">("pending");
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [processingIds, setProcessingIds] = useState<Record<number, "approve" | "reject">>({});
  const [searchQuery, setSearchQuery] = useState("");
  const { showToast, updateToast } = useToast();

  const { data: pendingTransactions = [], isLoading: pendingLoading, isError: pendingError } = usePendingTransactions();
  const { data: allTransactions = [], isLoading: allLoading, isError: allError } = useAllTransactions(true);

  const approveMutation = useApproveTransaction();
  const rejectMutation = useRejectTransaction();

  const handleApprove = (id: number) => { setApprovingId(id); setRejectingId(null); };
  const handleRejectClick = (id: number) => { setRejectingId(id); setApprovingId(null); };

  const activeLoading = activeTab === "pending" ? pendingLoading : allLoading;
  const activeError   = activeTab === "pending" ? pendingError   : allError;
  const currentList   = activeTab === "pending" ? pendingTransactions : allTransactions;

  // Clean up processing IDs when the query cache updates and reflects the change
  useEffect(() => {
    setProcessingIds((prev) => {
      const next = { ...prev };
      let changed = false;

      for (const idStr of Object.keys(next)) {
        const id = Number(idStr);
        const inPending = pendingTransactions.some((t) => t.id === id);
        const matchInAll = allTransactions.find((t) => t.id === id);
        const isPendingInAll = matchInAll ? matchInAll.status === "PENDING" : false;

        if (!inPending && (!matchInAll || !isPendingInAll)) {
          delete next[id];
          changed = true;
        }
      }

      return changed ? next : prev;
    });
  }, [pendingTransactions, allTransactions]);

  const filteredList = useMemo(() => {
    const sorted = [...currentList].sort((a, b) => b.createdAt - a.createdAt);

    if (!searchQuery.trim()) return sorted;

    return sorted.filter((t) => {
      const emailMatch = fuzzyMatch(t.userEmail, searchQuery).matched;
      const typeMatch = fuzzyMatch(t.type, searchQuery).matched;
      const notesMatch = t.notes ? fuzzyMatch(t.notes, searchQuery).matched : false;
      const amountMatch = fuzzyMatch(t.amount.toString(), searchQuery).matched;
      return emailMatch || typeMatch || notesMatch || amountMatch;
    });
  }, [currentList, searchQuery]);

  const transactionToApprove = approvingId != null
    ? (pendingTransactions.find(t => t.id === approvingId) ?? allTransactions.find(t => t.id === approvingId))
    : null;

  const transactionToReject = rejectingId != null
    ? (pendingTransactions.find(t => t.id === rejectingId) ?? allTransactions.find(t => t.id === rejectingId))
    : null;

  const executeApprove = (id: number) => {
    setApprovingId(null);
    setProcessingIds((prev) => ({ ...prev, [id]: "approve" }));
    const toastId = showToast("Approving transaction...", "loading");
    approveMutation.mutate(id, {
      onSuccess: () => {
        updateToast(toastId, "Transaction approved successfully!", "success");
      },
      onError: (err) => {
        updateToast(toastId, err.message || "Failed to approve transaction", "error");
        setProcessingIds((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      },
    });
  };

  const executeReject = (id: number, reason?: string) => {
    setRejectingId(null);
    setProcessingIds((prev) => ({ ...prev, [id]: "reject" }));
    const toastId = showToast("Rejecting transaction...", "loading");
    rejectMutation.mutate(
      { id, reason: reason || "" },
      {
        onSuccess: () => {
          updateToast(toastId, "Transaction rejected successfully!", "success");
        },
        onError: (err) => {
          updateToast(toastId, err.message || "Failed to reject transaction", "error");
          setProcessingIds((prev) => {
            const next = { ...prev };
            delete next[id];
            return next;
          });
        },
      }
    );
  };

  return {
    activeTab,
    setActiveTab,
    rejectingId,
    setRejectingId,
    approvingId,
    setApprovingId,
    processingIds,
    searchQuery,
    setSearchQuery,
    filteredList,
    activeLoading,
    activeError,
    transactionToApprove,
    transactionToReject,
    handleApprove,
    handleRejectClick,
    executeApprove,
    executeReject,
    approveMutationPending: approveMutation.isPending,
    rejectMutationPending: rejectMutation.isPending,
    pendingTransactionsCount: pendingTransactions.length,
    allTransactionsCount: allTransactions.length,
    allLoading,
  };
}
