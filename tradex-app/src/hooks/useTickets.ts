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
}


export interface TicketDetail extends Ticket {
  description: string;
  adminNotes?: string;
  resolvedByEmail?: string;
  resolvedAt?: string;
  attachments: TicketAttachment[];
  comments: TicketComment[];
  history?: TicketHistory[];
  uploadFailed?: boolean;
  reopenCount?: number;
}

export function useMyTickets() {
  return useQuery<Ticket[]>({
    queryKey: ["myTickets"],
    queryFn: () => api("/tickets")
  });
}

export function useTicketDetail(ticketId: number | null) {
  const queryClient = useQueryClient();
  return useQuery<TicketDetail>({
    queryKey: ["ticketDetail", ticketId],
    queryFn: () => api(`/tickets/${ticketId}`),
    enabled: ticketId !== null,
    placeholderData: () => {
      if (!ticketId) return undefined;
      const adminTickets = queryClient.getQueryData<Ticket[]>(["adminTickets"]);
      const myTickets = queryClient.getQueryData<Ticket[]>(["myTickets"]);
      const t = adminTickets?.find(x => x.id === ticketId) || myTickets?.find(x => x.id === ticketId);
      if (t) {
        return {
          ...t,
          description: "Loading ticket details...",
          comments: [],
          attachments: []
        } as TicketDetail;
      }
      return undefined;
    }
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
          headers: {
            "Content-Type": "multipart/form-data"
          }
        });
        return res;
      } catch (err: any) {
        const errMsg = err.message || "";
        const isUploadFailure = errMsg.toLowerCase().includes("upload attachment") || 
                                errMsg.toLowerCase().includes("storage server") || 
                                errMsg.toLowerCase().includes("supabase") ||
                                errMsg.toLowerCase().includes("nosuchbucket") ||
                                errMsg.toLowerCase().includes("s3");

        if (isUploadFailure && formData.has("files")) {
          const fallbackFormData = new FormData();
          const ticketPart = formData.get("ticket");
          if (ticketPart) {
            fallbackFormData.append("ticket", ticketPart);
          }
          const res = await api("/tickets", {
            method: "POST",
            body: fallbackFormData,
            headers: {
              "Content-Type": "multipart/form-data"
            }
          });
          return { ...res, uploadFailed: true };
        }
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myTickets"] });
    }
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
            headers: { "Content-Type": "multipart/form-data" },
            body: formData
          });
          return res;
        } catch (err: any) {
          const errMsg = err.message || "";
          const isUploadFailure = errMsg.toLowerCase().includes("upload attachment") || 
                                  errMsg.toLowerCase().includes("storage server") || 
                                  errMsg.toLowerCase().includes("supabase") ||
                                  errMsg.toLowerCase().includes("nosuchbucket") ||
                                  errMsg.toLowerCase().includes("s3");

          if (isUploadFailure) {
            const fallbackRes = await api(`/tickets/${ticketId}/comments`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ message })
            });
            return { ...fallbackRes, uploadFailed: true };
          }
          throw err;
        }
      } else {
        return api(`/tickets/${ticketId}/comments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message })
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticketDetail", ticketId] });
    }
  });
}

function useUserTicketMutation(ticketId: number, action: "reopen" | "close") {
  const queryClient = useQueryClient();
  return useMutation<TicketDetail, Error, void>({
    mutationFn: () => {
      return api(`/tickets/${ticketId}/${action}`, {
        method: "POST"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticketDetail", ticketId] });
      queryClient.invalidateQueries({ queryKey: ["myTickets"] });
      queryClient.invalidateQueries({ queryKey: ["adminTickets"] });
    }
  });
}

function useAdminTicketMutation<TVariables>(ticketId: number, action: "status" | "assign" | "claim", method: "PATCH" | "POST" = "PATCH") {
  const queryClient = useQueryClient();
  return useMutation<TicketDetail, Error, TVariables>({
    mutationFn: (body) => {
      return api(`/admin/tickets/${ticketId}/${action}`, {
        method,
        body: body ? JSON.stringify(body) : undefined
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticketDetail", ticketId] });
      queryClient.invalidateQueries({ queryKey: ["adminTickets"] });
    }
  });
}

export function useReopenTicket(ticketId: number) {
  return useUserTicketMutation(ticketId, "reopen");
}

export function useCloseTicket(ticketId: number) {
  return useUserTicketMutation(ticketId, "close");
}


// Admin Hooks
export function useAdminTickets(isAdmin: boolean) {
  return useQuery<Ticket[]>({
    queryKey: ["adminTickets"],
    queryFn: () => api("/admin/tickets"),
    enabled: isAdmin
  });
}

export function useUpdateTicketStatus(ticketId: number) {
  return useAdminTicketMutation<{ status: string }>(ticketId, "status");
}


export function useAssignTicket(ticketId: number) {
  return useAdminTicketMutation<{ assignedToPermission: string | null }>(ticketId, "assign");
}

export function useClaimTicket(ticketId: number) {
  return useAdminTicketMutation<void>(ticketId, "claim");
}

export function useUserActiveTickets(email: string | null) {
  return useQuery<Ticket[]>({
    queryKey: ["userActiveTickets", email],
    queryFn: () => api(`/admin/tickets/active?email=${encodeURIComponent(email || "")}`),
    enabled: !!email
  });
}
