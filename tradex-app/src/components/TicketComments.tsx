import React from "react";
import Icon from "./Icon";
import styles from "./TicketDetailDrawer.module.css";
import { formatTime } from "../utils/dashboardHelpers";
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

  return (
    <>
      <div className={styles.chatTimeline}>
        {comments.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--muted)", fontSize: "14px" }}>
            <Icon name="forum" style={{ fontSize: "36px", marginBottom: "8px", color: "var(--border)" }} />
            <p>No replies yet. Type in the box below to start the conversation.</p>
          </div>
        ) : (
          comments.map((comment, index) => {
            const currentDay = getDayLabel(comment.createdAt);
            const previousDay = index > 0 ? getDayLabel(comments[index - 1].createdAt) : null;
            const showDateSeparator = currentDay !== previousDay;

            return (
              <React.Fragment key={comment.id}>
                {showDateSeparator && (
                  <TimelineDateSeparator dateInput={comment.createdAt} />
                )}
                <div
                  className={`${styles.commentBubble} ${comment.adminReply ? styles.bubbleAdmin : styles.bubbleUser
                    }`}
                >
                  <div className={styles.commentHeader}>
                    <span className={`${styles.authorName} ${comment.adminReply ? styles.authorAdmin : styles.authorUser
                      }`}>
                      {comment.adminReply ? "SUPPORT TEAM" : comment.authorEmail}
                    </span>
                    <span className={styles.commentTime}>
                      {formatTime(comment.createdAt)}
                    </span>
                  </div>
                  <p className={styles.commentText}>{comment.message}</p>
                </div>
              </React.Fragment>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Reply forms and notices based on ticket status */}
      {ticketStatus === "RESOLVED" && (
        <div className={styles.resolvedNotice} style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "center" }}>
          <p style={{ margin: 0 }}>This ticket has been marked as resolved.</p>
          <div className={styles.actionButtons}>
            <button
              onClick={onReopen}
              className={styles.reopenBtn}
              disabled={isReopenPending || reopenCount >= 2}
              style={reopenCount >= 2 ? {
                opacity: 0.5,
                cursor: "not-allowed",
                background: "var(--surface-3)",
                color: "var(--muted)"
              } : undefined}
            >
              <Icon name="refresh" />
              <span>{reopenCount >= 2 ? "Reopen Limit Reached" : "Reopen Ticket"}</span>
            </button>
            <button
              onClick={onCloseTicket}
              className={styles.closeTicketBtn}
              disabled={isClosePending}
            >
              <Icon name="check_circle" />
              <span>Close Ticket</span>
            </button>
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
        <form onSubmit={handleSubmit} className={styles.replyForm} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {(errorMsg || validationError) && (
            <div style={{ color: "var(--danger)", padding: "10px", borderRadius: "8px", background: "rgba(255, 90, 106, 0.1)", fontSize: "13px", border: "1px solid rgba(255, 90, 106, 0.15)" }}>
              {errorMsg || validationError}
            </div>
          )}
          <div className={styles.replyInputContainer}>
            <textarea
              placeholder="Type your reply here..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className={styles.replyTextarea}
              maxLength={2000}
              rows={3}
            />

            {/* Attachment Preview Items Inside the Box */}
            {selectedFiles.length > 0 && (
              <div className={styles.previewItems}>
                {selectedFiles.map((file, idx) => {
                  const isImage = file.type.startsWith("image/");
                  return (
                    <div key={idx} className={styles.previewItem}>
                      {isImage ? (
                        <img
                          src={URL.createObjectURL(file)}
                          alt="preview"
                          className={styles.previewImage}
                        />
                      ) : (
                        <div className={styles.previewFileIcon}>
                          <Icon name="insert_drive_file" style={{ fontSize: "20px" }} />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));
                        }}
                        className={styles.removePreviewBtn}
                      >
                        <Icon name="close" style={{ fontSize: "10px" }} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              {!isAdmin && (() => {
                const remainingAllowed = Math.max(0, 5 - attachmentsCount);
                const isLimitReached = remainingAllowed <= 0;
                return (
                  <label style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 14px",
                    background: isLimitReached ? "var(--surface-3)" : "var(--surface-2)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    cursor: isLimitReached ? "not-allowed" : "pointer",
                    opacity: isLimitReached ? 0.6 : 1,
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "var(--text)",
                    transition: "all 0.2s"
                  }}>
                    <Icon name="attach_file" style={{ fontSize: "16px" }} />
                    {isLimitReached ? "Upload Limit Reached" : "Attach Screenshots"}
                    <input
                      type="file"
                      multiple
                      disabled={isLimitReached}
                      accept="image/png, image/jpeg, image/webp"
                      onChange={(e) => {
                        if (e.target.files) {
                          setValidationError(null);
                          const filesArray = Array.from(e.target.files);
                          
                          const maxNewFiles = remainingAllowed - selectedFiles.length;
                          if (maxNewFiles <= 0) {
                            setValidationError("This ticket has reached the maximum limit of 5 attachments.");
                            return;
                          }

                          if (filesArray.length > maxNewFiles) {
                            setValidationError(`You can only add ${maxNewFiles} more attachment(s) to this ticket.`);
                            return;
                          }

                          for (const file of filesArray) {
                            if (file.size > 5 * 1024 * 1024) {
                              setValidationError(`File "${file.name}" exceeds the 5MB size limit.`);
                              return;
                            }
                            const validTypes = ["image/jpeg", "image/png", "image/webp"];
                            if (!validTypes.includes(file.type)) {
                              setValidationError(`File "${file.name}" is not a supported format (JPEG, PNG, WEBP).`);
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
                <span style={{ fontSize: "12px", color: "#00e0a4", fontWeight: "600", margin: "15px" }}>
                  {selectedFiles.length} file(s) selected
                </span>
              )}
            </div>
            <button
              type="submit"
              disabled={isAddCommentPending || (!replyText.trim() && selectedFiles.length === 0)}
              className={styles.sendBtn}
            >
              <span>Send</span>
              <Icon name="send" style={{ fontSize: "16px" }} />
            </button>
          </div>
        </form>
      )}
    </>
  );
}
