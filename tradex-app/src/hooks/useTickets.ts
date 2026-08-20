import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../utils/api";

export interface TicketAttachment {
  id: number;
  fileName: string;
  contentType: string;
  fileSize: number;
  createdAt: string;
}

export interface TicketComment {
  id: number;
  authorEmail: string;
  message: string;
  adminReply: boolean;
  createdAt: string;
  uploadFailed?: boolean;
}

export interface TicketHistory {
  id: number;
  action: string;
  details: string;
  performedBy: string;
  createdAt: string;
}

export interface Ticket {
  id: number;
  ticketNumber: string;
  userEmail: string;
  category: "GENERAL" | "ACCOUNT_ISSUE" | "PAYMENT_ISSUE" | "TECHNICAL" | "OTHER";
  subject: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  assignedToPermission?: string;
  assignedToUserEmail?: string;
  assignedToUserPermissions?: string[];
  claimedAt?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface TicketDetail extends Ticket {
  description: string;
  adminNotes?: string;
  resolvedByEmail?: string;
  attachments: TicketAttachment[];
  comments: TicketComment[];
  history?: TicketHistory[];
  uploadFailed?: boolean;
  reopenCount?: number;
}

export const ticketKeys = {
  all: ["tickets"] as const,
  myTickets: () => ["myTickets"] as const,
  adminTickets: () => ["adminTickets"] as const,
  detail: (id: number | null) => ["ticketDetail", id] as const,
  activeByUser: (email: string | null) => ["userActiveTickets", email] as const,
};

function isStorageFailure(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const msg = ((err as { message?: string }).message || "").toLowerCase();
  return (
    msg.includes("upload attachment") ||
    msg.includes("store attachment") ||
    msg.includes("storage") ||
    msg.includes("attachment")
  );
}

export function useMyTickets() {
  return useQuery<Ticket[]>({
    queryKey: ticketKeys.myTickets(),
    queryFn: () => api("/tickets"),
    staleTime: 30_000,
  });
}

export function useTicketDetail(ticketId: number | null) {
  const queryClient = useQueryClient();
  return useQuery<TicketDetail>({
    queryKey: ticketKeys.detail(ticketId),
    queryFn: () => api(`/tickets/${ticketId}`),
    enabled: ticketId !== null,
    placeholderData: () => {
      if (!ticketId) return undefined;
      const adminTickets = queryClient.getQueryData<Ticket[]>(ticketKeys.adminTickets());
      const myTickets = queryClient.getQueryData<Ticket[]>(ticketKeys.myTickets());
      const t = adminTickets?.find((x) => x.id === ticketId) || myTickets?.find((x) => x.id === ticketId);
      if (t) {
        return {
          ...t,
          description: "Loading ticket details...",
          comments: [],
          attachments: [],
        } as TicketDetail;
      }
      return undefined;
    },
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();
  return useMutation<TicketDetail, Error, FormData>({
    mutationFn: async (formData: FormData) => {
      try {
        const res = await api("/tickets", {
          method: "POST",
          body: formData,
        });
        return res;
      } catch (err: unknown) {
        if (isStorageFailure(err) && formData.has("files")) {
          const fallbackFormData = new FormData();
          const ticketPart = formData.get("ticket");
          if (ticketPart) {
            fallbackFormData.append("ticket", ticketPart);
          }
          const res = await api("/tickets", {
            method: "POST",
            body: fallbackFormData,
          });
          return { ...res, uploadFailed: true };
        }
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.myTickets() });
    },
  });
}

export function useAddComment(ticketId: number) {
  const queryClient = useQueryClient();
  return useMutation<TicketComment, Error, { message: string; files?: File[] }>({
    mutationFn: async ({ message, files }) => {
      if (files && files.length > 0) {
        const formData = new FormData();
        formData.append("comment", new Blob([JSON.stringify({ message })], { type: "application/json" }));
        files.forEach((file) => formData.append("files", file));
        try {
          const res = await api(`/tickets/${ticketId}/comments`, {
            method: "POST",
            body: formData,
          });
          return res;
        } catch (err: unknown) {
          if (isStorageFailure(err)) {
            const fallbackRes = await api(`/tickets/${ticketId}/comments`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ message }),
            });
            return { ...fallbackRes, uploadFailed: true };
          }
          throw err;
        }
      } else {
        return api(`/tickets/${ticketId}/comments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message }),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.detail(ticketId) });
      queryClient.invalidateQueries({ queryKey: ticketKeys.adminTickets() });
      queryClient.invalidateQueries({ queryKey: ticketKeys.myTickets() });
    },
  });
}

function useTicketMutation<TVariables = void>(
  ticketId: number,
  endpoint: string,
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE" = "POST"
) {
  const queryClient = useQueryClient();
  return useMutation<TicketDetail, Error, TVariables>({
    mutationFn: (body) => {
      return api(endpoint, {
        method,
        body: body ? JSON.stringify(body) : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.detail(ticketId) });
      queryClient.invalidateQueries({ queryKey: ticketKeys.myTickets() });
      queryClient.invalidateQueries({ queryKey: ticketKeys.adminTickets() });
      queryClient.invalidateQueries({ queryKey: ["dashboardMetrics"] });
    },
  });
}

export function useReopenTicket(ticketId: number) {
  return useTicketMutation(ticketId, `/tickets/${ticketId}/reopen`);
}

export function useCloseTicket(ticketId: number) {
  return useTicketMutation(ticketId, `/tickets/${ticketId}/close`);
}

// Admin Hooks
export function useAdminTickets(isAdmin: boolean) {
  return useQuery<Ticket[]>({
    queryKey: ticketKeys.adminTickets(),
    queryFn: () => api("/admin/tickets"),
    enabled: isAdmin,
    staleTime: 30_000,
  });
}

export function useUpdateTicketStatus(ticketId: number) {
  return useTicketMutation<{ status: string }>(ticketId, `/admin/tickets/${ticketId}/status`, "PATCH");
}

export function useAssignTicket(ticketId: number) {
  return useTicketMutation<{ assignedToPermission: string | null }>(ticketId, `/admin/tickets/${ticketId}/assign`, "PATCH");
}

export function useClaimTicket(ticketId: number) {
  return useTicketMutation<void>(ticketId, `/admin/tickets/${ticketId}/claim`, "PATCH");
}

export function useUserActiveTickets(email: string | null) {
  return useQuery<Ticket[]>({
    queryKey: ticketKeys.activeByUser(email),
    queryFn: () => api(`/admin/tickets/active?email=${encodeURIComponent(email || "")}`),
    enabled: !!email,
    staleTime: 30_000,
  });
}
