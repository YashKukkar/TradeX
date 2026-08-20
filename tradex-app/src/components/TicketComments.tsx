import React from "react";
import Icon from "./Icon";
import ActionButton from "./ActionButton";
import styles from "./TicketDetailDrawer.module.css";
import TimelineDateSeparator, { getDayLabel } from "./TimelineDateSeparator";

interface Comment {
  id: number;
  message: string;
  authorEmail: string;
  adminReply: boolean;
  createdAt: string | number;
}

interface TicketCommentsProps {
  comments: Comment[];
  ticketStatus: string;
  replyText: string;
  setReplyText: (text: string) => void;
  selectedFiles: File[];
  setSelectedFiles: React.Dispatch<React.SetStateAction<File[]>>;
  errorMsg?: string | null;
  attachmentsCount: number;
  isAdmin: boolean;
  reopenCount: number;
  onSendReply: (message: string, files: File[]) => void;
  onReopen: () => void;
  onCloseTicket: () => void;
  isAddCommentPending: boolean;
  isReopenPending: boolean;
  isClosePending: boolean;
  chatEndRef: React.RefObject<HTMLDivElement | null>;
  onlyTimeline?: boolean;
  onlyEditor?: boolean;
}

export default function TicketComments({
  comments,
  ticketStatus,
  replyText,
  setReplyText,
  selectedFiles,
  setSelectedFiles,
  errorMsg,
  attachmentsCount,
  isAdmin,
  reopenCount,
  onSendReply,
  onReopen,
  onCloseTicket,
  isAddCommentPending,
  isReopenPending,
  isClosePending,
  chatEndRef,
  onlyTimeline = false,
  onlyEditor = false,
}: TicketCommentsProps) {
  const [validationError, setValidationError] = React.useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hasText = replyText.trim().length > 0;
    const hasFiles = selectedFiles.length > 0;
    if (!hasText && !hasFiles) return;

    const messageToSend = hasText
      ? replyText.trim()
      : `Sent ${selectedFiles.length} screenshot${selectedFiles.length > 1 ? "s" : ""}`;

    setValidationError(null);
    onSendReply(messageToSend, selectedFiles);
  };

  // 1. TIMELINE LIST ONLY
  if (onlyTimeline) {
    const getInitials = (email: string) => {
      const parts = email.split("@")[0].split(/[._-]/);
      if (parts.length > 1) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return parts[0].substring(0, 2).toUpperCase();
    };

    const getAvatarColor = (email: string) => {
      let hash = 0;
      for (let i = 0; i < email.length; i++) {
        hash = email.charCodeAt(i) + ((hash << 5) - hash);
      }
      const colors = ["var(--primary)", "var(--success)", "var(--warning)", "var(--danger)"];
      return colors[Math.abs(hash) % colors.length];
    };

    const formatCompactTimestamp = (dateInput: string | number) => {
      const date = typeof dateInput === "number" ? new Date(dateInput * 1000) : new Date(dateInput);
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);

      const timeString = date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });

      if (date.toDateString() === today.toDateString()) {
        return timeString;
      } else if (date.toDateString() === yesterday.toDateString()) {
        return `Yesterday • ${timeString}`;
      } else {
        const formattedDate = date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
        return `${formattedDate} • ${timeString}`;
      }
    };

    return (
      <div className={styles.timelineThread}>
        {comments.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--muted)", fontSize: "14px" }}>
            <Icon name="forum" style={{ fontSize: "36px", marginBottom: "8px", color: "var(--border)" }} />
            <p>No comments yet. Type in the box below to start the conversation.</p>
          </div>
        ) : (
          comments.map((comment, index) => {
            const currentDay = getDayLabel(comment.createdAt);
            const previousDay = index > 0 ? getDayLabel(comments[index - 1].createdAt) : null;
            const showDateSeparator = currentDay !== previousDay;

            // Group consecutive comments by the same author on the same day
            const prevComment = index > 0 ? comments[index - 1] : null;
            const isSameAuthor = prevComment && prevComment.authorEmail === comment.authorEmail;
            const isSameDay = prevComment && getDayLabel(prevComment.createdAt) === currentDay;
            const groupWithPrevious = isSameAuthor && isSameDay && !showDateSeparator;

            return (
              <React.Fragment key={comment.id}>
                {showDateSeparator && (
                  <div style={{ margin: "12px 0 8px 0" }}>
                    <TimelineDateSeparator dateInput={comment.createdAt} />
                  </div>
                )}
                <div className={`${styles.timelinePost} ${groupWithPrevious ? styles.timelinePostGrouped : ""}`}>
                  {!groupWithPrevious ? (
                    <div
                      className={`${styles.avatarCircle} ${comment.adminReply ? styles.avatarAdmin : ""}`}
                      style={{ backgroundColor: getAvatarColor(comment.authorEmail) }}
                    >
                      {getInitials(comment.authorEmail)}
                    </div>
                  ) : (
                    <div style={{ width: "30px", flexShrink: 0 }} />
                  )}

                  <div className={styles.postContent}>
                    {!groupWithPrevious && (
                      <div className={styles.postHeader}>
                        <span className={styles.authorEmail}>
                          {(() => {
                            if (comment.adminReply && !isAdmin) {
                              return "Support Staff";
                            }
                            const prefix = comment.authorEmail.split("@")[0];
                            const rawFirst = prefix.split(".")[0].split("_")[0];
                            return rawFirst.charAt(0).toUpperCase() + rawFirst.slice(1);
                          })()}
                        </span>
                        <span className={`${styles.roleBadge} ${comment.adminReply ? styles.roleAdmin : styles.roleUser}`}>
                          {comment.adminReply ? "Support Staff" : "User"}
                        </span>
                        <span className={styles.postTime}>
                          {formatCompactTimestamp(comment.createdAt)}
                        </span>
                      </div>
                    )}
                    <div className={`${styles.messageBubble} ${comment.adminReply ? styles.bubbleAdmin : styles.bubbleUser}`}>
                      <p className={styles.postMessage}>{comment.message}</p>
                      {groupWithPrevious && (
                        <span className={styles.hoverTime}>
                          {new Date(typeof comment.createdAt === "number" ? comment.createdAt * 1000 : comment.createdAt)
                            .toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>
    );
  }

  // 2. STICKY INPUT FOOTER ONLY
  if (onlyEditor) {
    return (
      <div className={styles.stickyFooterContainer}>
        {ticketStatus === "RESOLVED" && (
          <div className={styles.resolvedNotice} style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "center" }}>
            <p style={{ margin: 0 }}>This ticket has been marked as resolved.</p>
            <div className={styles.actionButtons}>
              <ActionButton
                onClick={onReopen}
                className={styles.reopenBtn}
                disabled={reopenCount >= 2}
                loading={isReopenPending}
                loadingText="Reopening..."
                iconName="refresh"
                style={reopenCount >= 2 ? {
                  opacity: 0.5,
                  cursor: "not-allowed",
                  background: "var(--surface-3)",
                  color: "var(--muted)"
                } : undefined}
              >
                {reopenCount >= 2 ? "Reopen Limit Reached" : "Reopen Ticket"}
              </ActionButton>
              <ActionButton
                onClick={onCloseTicket}
                className={styles.closeTicketBtn}
                loading={isClosePending}
                loadingText="Closing..."
                iconName="check_circle"
              >
                Close This Ticket
              </ActionButton>
            </div>
            {reopenCount >= 2 && (
              <span style={{ fontSize: "12px", color: "var(--danger)", textAlign: "center" }}>
                This ticket has been reopened 2 times. You must close this ticket and raise a new one if you still need help.
              </span>
            )}
          </div>
        )}

        {ticketStatus === "CLOSED" && (
          <div className={styles.closedNotice}>
            <Icon name="lock" style={{ fontSize: "16px" }} />
            <span>This ticket is closed. Chat is disabled.</span>
          </div>
        )}

        {ticketStatus !== "RESOLVED" && ticketStatus !== "CLOSED" && (
          <form onSubmit={handleSubmit} className={styles.unifiedInputBox}>
            {(errorMsg || validationError) && (
              <div style={{ color: "var(--danger)", padding: "8px 12px", borderRadius: "6px", background: "rgba(255, 90, 106, 0.1)", fontSize: "12px", border: "1px solid rgba(255, 90, 106, 0.15)", marginBottom: "8px" }}>
                {errorMsg || validationError}
              </div>
            )}

            <textarea
              placeholder="Type your reply here... (Press Enter to send, Shift+Enter for new line)"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if ((replyText.trim() || selectedFiles.length > 0) && !isAddCommentPending) {
                    handleSubmit(e);
                  }
                }
              }}
              className={styles.compactTextarea}
              maxLength={2000}
              rows={2}
            />

            {/* Attachment Preview Items */}
            {selectedFiles.length > 0 && (
              <div className={styles.previewItems} style={{ display: "flex", gap: "8px", padding: "8px" }}>
                {selectedFiles.map((file, idx) => {
                  const isImage = file.type.startsWith("image/");
                  return (
                    <div key={idx} className={styles.previewItem} style={{ width: "45px", height: "45px", position: "relative" }}>
                      {isImage ? (
                        <img
                          src={URL.createObjectURL(file)}
                          alt="preview"
                          style={{ width: "100%", height: "100%", borderRadius: "4px", objectFit: "cover" }}
                        />
                      ) : (
                        <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.15)", borderRadius: "4px" }}>
                          <Icon name="insert_drive_file" style={{ fontSize: "18px", color: "var(--muted)" }} />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));
                        }}
                        style={{
                          position: "absolute",
                          top: "-4px",
                          right: "-4px",
                          background: "var(--danger)",
                          color: "var(--text)",
                          border: "none",
                          borderRadius: "50%",
                          width: "14px",
                          height: "14px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer"
                        }}
                      >
                        <Icon name="close" style={{ fontSize: "8px" }} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Action Row */}
            <div className={styles.inputActionRow}>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                {!isAdmin && (() => {
                  const remainingAllowed = Math.max(0, 5 - attachmentsCount);
                  const isLimitReached = remainingAllowed <= 0;
                  return (
                    <label className={styles.attachButtonLabel}>
                      <Icon name="attach_file" style={{ fontSize: "15px" }} />
                      <span>{isLimitReached ? "Limit Reached" : "Attach"}</span>
                      <input
                        type="file"
                        multiple
                        disabled={isLimitReached}
                        accept="image/png, image/jpeg"
                        onChange={(e) => {
                          if (e.target.files) {
                            setValidationError(null);
                            const filesArray = Array.from(e.target.files);

                            const maxNewFiles = remainingAllowed - selectedFiles.length;
                            if (maxNewFiles <= 0) {
                              setValidationError("Maximum limit of 5 attachments reached.");
                              return;
                            }

                            if (filesArray.length > maxNewFiles) {
                              setValidationError(`Only ${maxNewFiles} more attachment(s) allowed.`);
                              return;
                            }

                            for (const file of filesArray) {
                              if (file.size > 5 * 1024 * 1024) {
                                setValidationError(`"${file.name}" exceeds 5MB limit.`);
                                return;
                              }
                              const validTypes = ["image/jpeg", "image/png"];
                              if (!validTypes.includes(file.type)) {
                                setValidationError(`"${file.name}" format not supported.`);
                                return;
                              }
                            }

                            setSelectedFiles((prev) => [...prev, ...filesArray]);
                          }
                        }}
                        style={{ display: "none" }}
                      />
                    </label>
                  );
                })()}
                {!isAdmin && selectedFiles.length > 0 && (
                  <span style={{ fontSize: "11px", color: "var(--success)", fontWeight: "600" }}>
                    {selectedFiles.length} file(s)
                  </span>
                )}
              </div>

              <ActionButton
                type="submit"
                disabled={!replyText.trim() && selectedFiles.length === 0}
                loading={isAddCommentPending}
                loadingText="Sending..."
                iconName="send"
                className={styles.compactSendBtn}
              >
                Send
              </ActionButton>
            </div>
          </form>
        )}
      </div>
    );
  }

  // Fallback default full render (if neither onlyTimeline nor onlyEditor are specified)
  return (
    <>
      <div className={styles.commentList}>
        {comments.map((comment) => (
          <div
            key={comment.id}
            className={`${styles.commentBlock} ${comment.adminReply ? styles.commentBlockAdmin : ""}`}
          >
            <p>{comment.message}</p>
          </div>
        ))}
      </div>
    </>
  );
}
