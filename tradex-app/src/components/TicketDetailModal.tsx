import React, { useState, useEffect, useRef } from "react";
import Icon from "./Icon";
import { useTicketDetail, useAddComment, useUpdateTicketStatus, useUpdateAdminNotes, useReopenTicket, useCloseTicket, useAssignTicket, useClaimTicket } from "../hooks/useTickets";
import styles from "./TicketDetailDrawer.module.css";
import TicketComments from "./TicketComments";
import TimelineDateSeparator, { getDayLabel } from "./TimelineDateSeparator";
import TicketMetadataTab from "./TicketMetadataTab";
import TicketAdminToolsTab from "./TicketAdminToolsTab";
import { formatDateTime } from "../utils/dashboardHelpers";
import Toast from "./Toast";

// Status colors are now globally configured under index.css using status-pill-* utility classes

interface TicketDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketId: number | null;
  isAdmin: boolean;
}

type TabType = "conversation" | "info" | "notes" | "history";

export default function TicketDetailModal({ isOpen, onClose, ticketId, isAdmin }: TicketDetailModalProps) {
  const { data: ticket, isLoading } = useTicketDetail(ticketId);

  const [activeTab, setActiveTab] = useState<TabType>("info");
  const [replyText, setReplyText] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  const addCommentMutation = useAddComment(ticketId || 0);
  const updateStatusMutation = useUpdateTicketStatus(ticketId || 0);
  const updateNotesMutation = useUpdateAdminNotes(ticketId || 0);
  const reopenMutation = useReopenTicket(ticketId || 0);
  const closeMutation = useCloseTicket(ticketId || 0);
  const assignMutation = useAssignTicket(ticketId || 0);
  const claimMutation = useClaimTicket(ticketId || 0);

  // Sync admin notes state when ticket loads
  useEffect(() => {
    if (ticket?.adminNotes) {
      setAdminNotes(ticket.adminNotes);
    } else {
      setAdminNotes("");
    }
  }, [ticket]);

  // Reset to Info tab when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab("info");
    }
  }, [isOpen]);

  // Scroll to bottom of chat when new comments appear or chat tab is opened
  useEffect(() => {
    if (activeTab === "conversation") {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [ticket?.comments, activeTab]);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "warning" } | null>(null);

  const handleSendReply = (message: string, files: File[]) => {
    addCommentMutation.mutate({ message, files }, {
      onSuccess: (data) => {
        setReplyText("");
        setSelectedFiles([]);
        if (data && data.uploadFailed) {
          setToast({
            message: "Your reply was posted successfully, but attachments could not be uploaded at this time.",
            type: "warning"
          });
        }
      }
    });
  };

  const handleStatusChange = (status: string) => {
    updateStatusMutation.mutate({ status });
  };

  const handleSaveNotes = () => {
    updateNotesMutation.mutate({ notes: adminNotes });
  };

  const handleAssignChange = (permission: string) => {
    assignMutation.mutate({ assignedToPermission: permission === "" ? null : permission });
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Background blur overlay */}
      <div className={styles.drawerOverlay} onClick={onClose} />

      {/* Sliding Drawer Container */}
      <aside className={styles.drawer} role="dialog" aria-modal="true">
        
        {/* Drawer Header */}
        <div className={styles.drawerHeader}>
          <div>
            <h2 className={styles.drawerTitle}>
              {isLoading ? "Loading Ticket..." : `Ticket ${ticket?.ticketNumber}`}
            </h2>
            {ticket && (
              <p className={styles.drawerSub}>
                Created by {ticket.userEmail}
              </p>
            )}
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close drawer">
            <Icon name="close" style={{ fontSize: "18px" }} />
          </button>
        </div>

        {ticket && (
          <>
            {/* Tab Bar Navigation */}
            <div className={styles.tabBar}>
              <button
                className={`${styles.tabBtn} ${activeTab === "conversation" ? styles.tabBtnActive : ""}`}
                onClick={() => setActiveTab("conversation")}
              >
                Conversation
              </button>
              <button
                className={`${styles.tabBtn} ${activeTab === "info" ? styles.tabBtnActive : ""}`}
                onClick={() => setActiveTab("info")}
              >
                Ticket Details
              </button>
              <button
                className={`${styles.tabBtn} ${activeTab === "history" ? styles.tabBtnActive : ""}`}
                onClick={() => setActiveTab("history")}
              >
                Timeline
              </button>
              {isAdmin && (
                <button
                  className={`${styles.tabBtn} ${activeTab === "notes" ? styles.tabBtnActive : ""}`}
                  onClick={() => setActiveTab("notes")}
                >
                  Admin Tools
                </button>
              )}
            </div>

            {/* Scrollable Content Body */}
            <div className={styles.drawerBody}>
              
              {/* Tab 1: Conversation Timeline */}
              {activeTab === "conversation" && (
                <TicketComments
                  comments={ticket.comments}
                  ticketStatus={ticket.status}
                  replyText={replyText}
                  setReplyText={setReplyText}
                  selectedFiles={selectedFiles}
                  setSelectedFiles={setSelectedFiles}
                  errorMsg={addCommentMutation.error ? (isAdmin ? addCommentMutation.error.message : addCommentMutation.error.message.replace(/supabase/gi, "storage server")) : null}
                  attachmentsCount={ticket.attachments?.length || 0}
                  isAdmin={isAdmin}
                  reopenCount={ticket.reopenCount || 0}
                  onSendReply={handleSendReply}
                  onReopen={() => reopenMutation.mutate()}
                  onCloseTicket={() => closeMutation.mutate()}
                  isAddCommentPending={addCommentMutation.isPending}
                  isReopenPending={reopenMutation.isPending}
                  isClosePending={closeMutation.isPending}
                  chatEndRef={chatEndRef}
                />
              )}

              {/* Tab 2: Ticket Metadata & Description */}
              {activeTab === "info" && (
                <TicketMetadataTab
                  ticket={ticket}
                  isAdmin={isAdmin}
                  onClaim={() => claimMutation.mutate()}
                  isClaimPending={claimMutation.isPending}
                />
              )}

              {/* Tab: History Log */}
              {activeTab === "history" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div className={styles.infoCard}>
                    <p className={styles.infoSectionTitle}>Ticket Activity History</p>
                    {ticket.history && ticket.history.length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0", marginTop: "16px", paddingLeft: "8px" }}>
                        {(() => {
                          const historyList = ticket.history || [];
                          return historyList.map((h, i) => {
                            const currentDay = getDayLabel(h.createdAt);
                            const previousDay = i > 0 ? getDayLabel(historyList[i - 1].createdAt) : null;
                            const showDateSeparator = currentDay !== previousDay;

                            return (
                              <React.Fragment key={h.id || i}>
                                {showDateSeparator && (
                                  <div style={{ marginTop: "6px", marginBottom: "14px" }}>
                                    <TimelineDateSeparator dateInput={h.createdAt} />
                                  </div>
                                )}
                                <div style={{ display: "flex", gap: "16px" }}>
                                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                                    <div style={{
                                      width: "12px",
                                      height: "12px",
                                      borderRadius: "50%",
                                      background: h.action === "CREATED" ? "var(--accent)" : "var(--primary)",
                                      border: "3px solid var(--bg-2)",
                                      boxShadow: "0 0 0 2px var(--border)",
                                      zIndex: 1,
                                      marginTop: "4px"
                                    }} />
                                    {i < historyList.length - 1 && (
                                      <div style={{
                                        width: "2px",
                                        flex: 1,
                                        background: "var(--border)",
                                        margin: "4px 0"
                                      }} />
                                    )}
                                  </div>
                                  <div style={{ flex: 1, paddingBottom: "20px" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "8px" }}>
                                      <span style={{ fontWeight: "700", color: "var(--text)", fontSize: "14px" }}>
                                        {h.action.replace(/_/g, " ")}
                                      </span>
                                      <span style={{ fontSize: "11px", color: "var(--muted)" }}>
                                        {formatDateTime(h.createdAt)}
                                      </span>
                                    </div>
                                    <p style={{ margin: "6px 0", color: "var(--muted)", fontSize: "13px", lineHeight: "1.4" }}>
                                      {h.details}
                                    </p>
                                    {h.performedBy && (
                                      <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px" }}>
                                        <span style={{ color: "var(--muted)" }}>By:</span>
                                        <span style={{ color: "var(--primary)", fontWeight: "600" }}>{h.performedBy}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </React.Fragment>
                            );
                          });
                        })()}
                      </div>
                    ) : (
                      <div style={{ textAlign: "center", padding: "40px 0", color: "var(--muted)", fontStyle: "italic" }}>
                        No history logs recorded for this ticket.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 3: Admin Tools & Status Update (Admins Only) */}
              {activeTab === "notes" && isAdmin && (
                <TicketAdminToolsTab
                  ticketStatus={ticket.status}
                  assignedPermission={ticket.assignedToPermission}
                  adminNotes={adminNotes}
                  setAdminNotes={setAdminNotes}
                  onStatusChange={handleStatusChange}
                  onAssignChange={handleAssignChange}
                  onSaveNotes={handleSaveNotes}
                  isAssignPending={assignMutation.isPending}
                  isNotesPending={updateNotesMutation.isPending}
                />
              )}

            </div>
          </>
        )}
      </aside>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
