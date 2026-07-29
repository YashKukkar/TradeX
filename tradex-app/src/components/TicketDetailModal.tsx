import React, { useState, useEffect, useRef } from "react";
import { useTicketDetail, useAddComment, useUpdateTicketStatus, useReopenTicket, useCloseTicket, useAssignTicket, useClaimTicket } from "../hooks/useTickets";
import { useRegisterOverlay } from "../context/OverlayContext";
import styles from "./TicketDetailDrawer.module.css";
import TicketComments from "./TicketComments";
import TimelineDateSeparator, { getDayLabel } from "./TimelineDateSeparator";
import TicketMetadataTab from "./TicketMetadataTab";
import SplitDrawerLayout from "./SplitDrawerLayout";
import TicketAttachments from "./TicketAttachments";
import SegmentedControl from "./SegmentedControl";
import Icon from "./Icon";
import { formatDateTime } from "../utils/dashboardHelpers";
import { useToast } from "../context/ToastContext";

interface TicketDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketId: number | null;
  isAdmin: boolean;
}

type TabType = "conversation" | "history";

export default function TicketDetailModal({ isOpen, onClose, ticketId, isAdmin }: TicketDetailModalProps) {
  useRegisterOverlay("ticket-drawer", isOpen);

  const { data: ticket, isLoading } = useTicketDetail(ticketId);

  const [activeTab, setActiveTab] = useState<TabType>("conversation");
  const [replyText, setReplyText] = useState("");
  const [descExpanded, setDescExpanded] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  const addCommentMutation = useAddComment(ticketId || 0);
  const updateStatusMutation = useUpdateTicketStatus(ticketId || 0);
  const reopenMutation = useReopenTicket(ticketId || 0);
  const closeMutation = useCloseTicket(ticketId || 0);
  const assignMutation = useAssignTicket(ticketId || 0);
  const claimMutation = useClaimTicket(ticketId || 0);

  // Reset states when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab("conversation");
      setDescExpanded(false);
    }
  }, [isOpen]);

  // Scroll to bottom of chat when new comments appear or chat tab is opened
  useEffect(() => {
    if (activeTab === "conversation") {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [ticket?.comments, activeTab]);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const { showToast } = useToast();

  const handleSendReply = (message: string, files: File[]) => {
    addCommentMutation.mutate({ message, files }, {
      onSuccess: (data) => {
        setReplyText("");
        setSelectedFiles([]);
        if (data && data.uploadFailed) {
          showToast("Your reply was posted successfully, but attachments could not be uploaded at this time.", "warning");
        }
      }
    });
  };

  const handleStatusChange = (status: string) => {
    updateStatusMutation.mutate({ status });
  };



  const handleAssignChange = (permission: string) => {
    assignMutation.mutate({ assignedToPermission: permission === "" ? null : permission });
  };

  // Section A: Collapsible Issue Summary
  const summarySection = ticket && (
    <div style={{
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: "8px",
      padding: "16px",
      display: "flex",
      flexDirection: "column",
      gap: "12px",
      position: "relative"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px" }}>
        <div>
          <p className={styles.infoSectionTitle} style={{ fontSize: "11px" }}>Issue Summary</p>
          <h3 style={{ margin: "4px 0 0 0", fontSize: "16px", color: "var(--text)", fontWeight: 700 }}>
            {ticket.subject}
          </h3>
        </div>
        <button
          onClick={() => setDescExpanded(!descExpanded)}
          style={{
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            color: "var(--text)",
            borderRadius: "6px",
            padding: "4px 8px",
            fontSize: "11px",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "4px"
          }}
        >
          <span>{descExpanded ? "Show Less" : "Show More"}</span>
          <Icon name={descExpanded ? "expand_less" : "expand_more"} style={{ fontSize: "14px" }} />
        </button>
      </div>

      <div style={{
        fontSize: "13.5px",
        color: "var(--text)",
        lineHeight: "1.5",
        whiteSpace: "pre-line",
        opacity: 0.9,
        maxHeight: descExpanded ? "none" : "48px",
        overflow: "hidden",
        position: "relative"
      }}>
        {ticket.description}
        {!descExpanded && ticket.description.length > 120 && (
          <div style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "20px",
            background: "linear-gradient(transparent, var(--surface))"
          }} />
        )}
      </div>
    </div>
  );

  // Section B: Screenshots and attachments gallery
  const gallerySection = ticket && (
    <TicketAttachments attachments={ticket.attachments || []} />
  );

  // Section C: Comments Timeline
  const conversationSection = ticket && (
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
      onlyTimeline={true}
    />
  );

  // Section D: History Log timeline map
  const activitySection = ticket && (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div className={styles.infoCard} style={{ background: "none", border: "none", boxShadow: "none", padding: 0 }}>
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
  );

  // Section E: Sticky bottom compose editor
  const composerSection = ticket && (
    <div style={{
      borderTop: "1px solid var(--border)",
      background: "var(--bg-2)",
      padding: "16px 24px",
      boxSizing: "border-box",
      flexShrink: 0
    }}>
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
        onlyEditor={true}
      />
    </div>
  );

  // Section F: Right sidebar metadata display and mutations
  const metadataSection = ticket && (
    <TicketMetadataTab
      ticket={ticket}
      isAdmin={isAdmin}
      onClaim={() => claimMutation.mutate()}
      isClaimPending={claimMutation.isPending}
      onStatusChange={handleStatusChange}
      onAssignChange={handleAssignChange}
      isAssignPending={assignMutation.isPending}
      isStatusPending={updateStatusMutation.isPending}
      onCloseTicket={() => closeMutation.mutate()}
      onReopen={() => reopenMutation.mutate()}
      isClosePending={closeMutation.isPending}
      isReopenPending={reopenMutation.isPending}
    />
  );

  const leftPaneContent = ticket && (
    isAdmin ? (
      // Support Workspace (Admin/Staff view)
      <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: "20px" }}>
          {summarySection}
          {gallerySection}
          <div style={{ width: "240px", marginTop: "4px" }}>
            <SegmentedControl
              options={[
                { value: "conversation", label: "Comments" },
                { value: "history", label: "Activity Log" },
              ]}
              value={activeTab}
              onChange={(val) => setActiveTab(val as TabType)}
            />
          </div>
          {activeTab === "conversation" ? conversationSection : activitySection}
        </div>
        {activeTab === "conversation" && composerSection}
      </div>
    ) : (
      // Customer Portal (Client view)
      <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          {conversationSection}
        </div>
        {composerSection}
      </div>
    )
  );

  const rightPaneContent = ticket && (
    isAdmin ? (
      // Support Workspace Right Column
      <div style={{ padding: "20px 24px" }}>
        {metadataSection}
      </div>
    ) : (
      // Customer Portal Right Column
      <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "16px", overflowY: "auto", height: "100%" }}>
        {metadataSection}
        {summarySection}
        {gallerySection}
      </div>
    )
  );

  return (
    <SplitDrawerLayout
      isOpen={isOpen}
      onClose={onClose}
      title={isLoading ? "Loading Ticket..." : `Ticket ${ticket?.ticketNumber}`}
      subtitle={ticket ? `Created by ${ticket.userEmail}` : undefined}
      leftPane={leftPaneContent}
      rightPane={rightPaneContent}
      width="1050px"
    />
  );
}
