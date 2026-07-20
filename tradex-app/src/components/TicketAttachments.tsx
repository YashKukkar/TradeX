import { useState, useEffect } from "react";
import Icon from "./Icon";
import styles from "./TicketDetailDrawer.module.css";
import { config } from "../config";
import axios from "axios";
import Toast from "./Toast";

interface Attachment {
  id: number;
  fileName: string;
  fileSize: number;
  contentType: string;
}

interface TicketAttachmentsProps {
  attachments: Attachment[];
}

export default function TicketAttachments({ attachments }: TicketAttachmentsProps) {
  const [imageUrls, setImageUrls] = useState<Record<number, string>>({});
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "warning" } | null>(null);

  // Load image attachments as Object URLs so they render inline
  useEffect(() => {
    if (!attachments || attachments.length === 0) return;

    const token = localStorage.getItem("token");
    const loadedUrls: Record<number, string> = {};

    const fetchImage = async (attId: number) => {
      try {
        const response = await axios.get(`${config.apiUrl}/tickets/attachments/${attId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          responseType: "blob",
          withCredentials: true,
        });
        const blob = response.data;
        const url = window.URL.createObjectURL(blob);
        loadedUrls[attId] = url;
        setImageUrls((prev) => ({ ...prev, [attId]: url }));
      } catch (err) {
        console.error("Failed to load attachment image", err);
      }
    };

    attachments.forEach((att) => {
      if (att.contentType.startsWith("image/")) {
        fetchImage(att.id);
      }
    });

    // Cleanup URLs on unmount
    return () => {
      Object.values(loadedUrls).forEach((url) => window.URL.revokeObjectURL(url));
    };
  }, [attachments]);

  const handleDownload = async (attId: number, fileName: string) => {
    const token = localStorage.getItem("token");
    try {
      const response = await axios.get(`${config.apiUrl}/tickets/attachments/${attId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: "blob",
        withCredentials: true,
      });
      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      setToast({
        message: "Failed to download file. The attachment might not exist on the storage server.",
        type: "error"
      });
    }
  };

  if (!attachments || attachments.length === 0) return null;

  return (
    <div className={styles.infoCard}>
      <p className={styles.infoSectionTitle}>Evidence & Attachments</p>
      <div className={styles.attachmentGrid}>
        {attachments.map((att) => (
          <div
            key={att.id}
            className={styles.attachmentItem}
            onClick={() => handleDownload(att.id, att.fileName)}
          >
            {att.contentType.startsWith("image/") && imageUrls[att.id] ? (
              <img
                src={imageUrls[att.id]}
                alt={att.fileName}
                style={{ width: "100%", height: "80px", objectFit: "cover", borderRadius: "6px" }}
              />
            ) : (
              <div style={{ height: "80px", display: "flex", alignItems: "center", justifyContent: "center", width: "100%", background: "rgba(0,0,0,0.15)", borderRadius: "6px" }}>
                <Icon name="description" style={{ fontSize: "36px", color: "var(--muted)" }} />
              </div>
            )}
            <span className={styles.attachmentName}>{att.fileName}</span>
            <span className={styles.attachmentSize}>{(att.fileSize / 1024).toFixed(1)} KB</span>
          </div>
        ))}
      </div>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
