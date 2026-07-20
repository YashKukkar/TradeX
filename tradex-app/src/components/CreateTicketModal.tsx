import React, { useState, useRef } from "react";
import Modal from "./Modal";
import Icon from "./Icon";
import { useCreateTicket } from "../hooks/useTickets";

interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (warning?: string | null) => void;
}

export default function CreateTicketModal({ isOpen, onClose, onSuccess }: CreateTicketModalProps) {
  const [category, setCategory] = useState("GENERAL");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const createMutation = useCreateTicket();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateAndAddFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    setErrorMsg("");
    const newFiles = Array.from(fileList);

    // Total files limit
    if (attachments.length + newFiles.length > 5) {
      setErrorMsg("You can upload a maximum of 5 attachments.");
      return;
    }

    // Size limit & content type validation
    for (const file of newFiles) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg(`File ${file.name} exceeds the 5MB size limit.`);
        return;
      }
      const validTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!validTypes.includes(file.type)) {
        setErrorMsg(`File ${file.name} is not a supported format (JPEG, PNG, WEBP).`);
        return;
      }
    }

    setAttachments((prev) => [...prev, ...newFiles]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files) {
      validateAndAddFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      validateAndAddFiles(e.target.files);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!subject.trim()) {
      setErrorMsg("Subject is required.");
      return;
    }
    if (!description.trim()) {
      setErrorMsg("Description is required.");
      return;
    }

    const formData = new FormData();
    
    // Spring Boot consumes Multipart Request with a JSON part named "ticket" and file parts named "files"
    const ticketData = JSON.stringify({
      category,
      subject,
      description
    });
    
    formData.append(
      "ticket",
      new Blob([ticketData], { type: "application/json" })
    );

    attachments.forEach((file) => {
      formData.append("files", file);
    });

     createMutation.mutate(formData, {
      onSuccess: (data) => {
        // Reset state
        setCategory("GENERAL");
        setSubject("");
        setDescription("");
        setAttachments([]);
        onClose();
        if (data && data.uploadFailed) {
          onSuccess?.("Your ticket was created successfully, but we encountered an issue uploading the attachments. Please try attaching them again later.");
        } else {
          onSuccess?.();
        }
      },
      onError: (err: any) => {
        const rawMsg = err.message || "Failed to create support ticket.";
        setErrorMsg(rawMsg.replace(/supabase/gi, "storage server"));
      }
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Support Ticket"
      subtitle="Describe your issue below. Our support agents will resolve it as soon as possible."
      size="sm"
    >
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {errorMsg && (
          <div style={{ color: "var(--danger)", padding: "10px", borderRadius: "8px", background: "rgba(255, 90, 106, 0.1)", fontSize: "14px", border: "1px solid rgba(255, 90, 106, 0.15)" }}>
            {errorMsg}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "14px", color: "var(--muted)" }}>Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{
              padding: "12px",
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              borderRadius: "10px",
              color: "var(--text)",
              fontSize: "14px",
              outline: "none"
            }}
          >
            <option value="GENERAL">General Support</option>
            <option value="ACCOUNT_ISSUE">Account Issue</option>
            <option value="PAYMENT_ISSUE">Payment Issue</option>
            <option value="TECHNICAL">Technical Issue</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "14px", color: "var(--muted)" }}>Subject</label>
          <input
            type="text"
            placeholder="Brief summary of the issue"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            style={{
              padding: "12px",
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              borderRadius: "10px",
              color: "var(--text)",
              fontSize: "14px",
              outline: "none"
            }}
            maxLength={200}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "14px", color: "var(--muted)" }}>Description</label>
          <textarea
            placeholder="Describe your issue in detail..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{
              padding: "12px",
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              borderRadius: "10px",
              color: "var(--text)",
              fontSize: "14px",
              outline: "none",
              minHeight: "120px",
              resize: "vertical"
            }}
            maxLength={5000}
          />
        </div>

        {/* Drag & Drop File Upload Area */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "14px", color: "var(--muted)" }}>Attachments (Max 5, JPEG/PNG/WEBP under 5MB)</label>
          
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: "24px",
              background: dragActive ? "rgba(0, 224, 164, 0.05)" : "var(--surface-2)",
              border: dragActive ? "2px dashed var(--primary)" : "2px dashed var(--border)",
              borderRadius: "12px",
              textAlign: "center",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.2s ease"
            }}
          >
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: "none" }}
              multiple
              accept="image/png, image/jpeg, image/webp"
              onChange={handleFileChange}
            />
            <Icon name="cloud_upload" style={{ fontSize: "32px", color: "var(--primary)" }} />
            <p style={{ margin: 0, fontSize: "14px" }}>
              Drag and drop screenshots here, or <span style={{ color: "var(--primary)", fontWeight: "500" }}>browse</span>
            </p>
          </div>

          {/* Attachment Preview Items */}
          {attachments.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "8px" }}>
              {attachments.map((file, idx) => (
                <div
                  key={idx}
                  style={{
                    position: "relative",
                    width: "80px",
                    height: "80px",
                    borderRadius: "8px",
                    overflow: "hidden",
                    border: "1px solid var(--border)",
                    background: "var(--bg-2)"
                  }}
                >
                  <img
                    src={URL.createObjectURL(file)}
                    alt="preview"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeAttachment(idx);
                    }}
                    style={{
                      position: "absolute",
                      top: "4px",
                      right: "4px",
                      background: "rgba(255, 90, 106, 0.8)",
                      border: "none",
                      color: "white",
                      width: "20px",
                      height: "20px",
                      borderRadius: "50%",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "12px"
                    }}
                  >
                    <Icon name="close" style={{ fontSize: "14px" }} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={createMutation.isPending}
          style={{
            marginTop: "8px",
            padding: "14px",
            background: "var(--primary)",
            color: "var(--bg)",
            border: "none",
            borderRadius: "10px",
            fontWeight: "600",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            opacity: createMutation.isPending ? 0.6 : 1,
            transition: "all 0.2s ease"
          }}
        >
          {createMutation.isPending ? "Submitting..." : "Raise Ticket"}
          <Icon name="send" style={{ fontSize: "18px" }} />
        </button>
      </form>
    </Modal>
  );
}
