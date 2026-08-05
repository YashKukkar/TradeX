import { useState, useEffect } from "react";
import Icon from "./Icon";
import { config } from "../config";
import axios from "axios";
import { useToast } from "../context/ToastContext";
import { safeStorage } from "../utils/api";

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
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const { showToast } = useToast();

  // Load image attachments as Object URLs
  useEffect(() => {
    if (!attachments || attachments.length === 0) return;

    const token = safeStorage.getItem("token");
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
        setImageUrls((prev) => ({ ...prev, [attId]: url }));
        loadedUrls[attId] = url;
      } catch (err) {
        console.error("Failed to load attachment image", err);
      }
    };

    attachments.forEach((att) => {
      if (att.contentType.startsWith("image/")) {
        fetchImage(att.id);
      }
    });

    return () => {
      Object.values(loadedUrls).forEach((url) => window.URL.revokeObjectURL(url));
    };
  }, [attachments]);

  const handleDownload = async (attId: number, fileName: string) => {
    const token = safeStorage.getItem("token");
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
      showToast("Failed to download file. The attachment might not exist on the storage server.", "error");
    }
  };

  const images = attachments.filter((att) => att.contentType.startsWith("image/"));
  const documents = attachments.filter((att) => !att.contentType.startsWith("image/"));

  // Lightbox Keyboard Navigation
  useEffect(() => {
    if (activeImageIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveImageIndex(null);
      } else if (e.key === "ArrowLeft" && activeImageIndex > 0) {
        setActiveImageIndex(activeImageIndex - 1);
        setZoomLevel(1);
      } else if (e.key === "ArrowRight" && activeImageIndex < images.length - 1) {
        setActiveImageIndex(activeImageIndex + 1);
        setZoomLevel(1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeImageIndex, images.length]);

  if (!attachments || attachments.length === 0) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "4px" }}>
      {/* 1. Screenshots Section */}
      {images.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--muted)", letterSpacing: "0.05em", fontWeight: 700 }}>
            Screenshots:
          </span>
          <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
            {images.map((img, idx) => (
              <div
                key={img.id}
                onClick={() => setActiveImageIndex(idx)}
                style={{
                  height: "56px",
                  width: "auto",
                  maxWidth: "60px",
                  borderRadius: "6px",
                  border: "1px solid var(--border)",
                  overflow: "hidden",
                  cursor: "zoom-in",
                  background: "rgba(0,0,0,0.2)",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "transform 0.15s ease",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.04)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; }}
              >
                <img
                  src={imageUrls[img.id] || ""}
                  alt="Thumbnail"
                  style={{ height: "100%", width: "auto", objectFit: "contain" }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Documents Section */}
      {documents.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <p style={{ margin: "4px 0 6px 0", fontSize: "12px", textTransform: "uppercase", color: "var(--muted)", letterSpacing: "0.05em", fontWeight: 700 }}>
            Files ({documents.length})
          </p>
          {documents.map((doc) => (
            <div
              key={doc.id}
              onClick={() => handleDownload(doc.id, doc.fileName)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 12px",
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                borderRadius: "6px",
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--primary)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden" }}>
                <Icon name="description" style={{ color: "var(--muted)", fontSize: "16px" }} />
                <span style={{ fontSize: "12px", color: "var(--text)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                  {doc.fileName}
                </span>
                <span style={{ fontSize: "10px", color: "var(--muted)" }}>
                  ({(doc.fileSize / 1024).toFixed(1)} KB)
                </span>
              </div>
              <Icon name="download" style={{ fontSize: "16px", color: "var(--muted)" }} />
            </div>
          ))}
        </div>
      )}

      {/* 3. Full-Screen Lightbox Portal Overlay */}
      {activeImageIndex !== null && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(10, 10, 10, 0.95)",
          backdropFilter: "blur(5px)",
          zIndex: 99999,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          animation: "fadeIn 0.2s ease"
        }}>
          {/* Top Bar Zoom & Close */}
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "60px",
            padding: "0 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)",
            zIndex: 100000
          }}>
            <span style={{ color: "#fff", fontSize: "13px", fontWeight: "500" }}>
              Screenshot {activeImageIndex + 1} of {images.length}
            </span>
            <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
              <button
                onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.25))}
                style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center" }}
              >
                <Icon name="zoom_out" style={{ fontSize: "20px" }} />
              </button>
              <button
                onClick={() => setZoomLevel(prev => Math.min(3, prev + 0.25))}
                style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center" }}
              >
                <Icon name="zoom_in" style={{ fontSize: "20px" }} />
              </button>
              <button
                onClick={() => { setZoomLevel(1); setActiveImageIndex(null); }}
                style={{
                  background: "rgba(255,255,255,0.1)",
                  border: "none",
                  borderRadius: "50%",
                  color: "#fff",
                  width: "36px",
                  height: "36px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <Icon name="close" style={{ fontSize: "20px" }} />
              </button>
            </div>
          </div>

          {/* Navigation Controls */}
          {activeImageIndex > 0 && (
            <button
              onClick={() => { setActiveImageIndex(activeImageIndex - 1); setZoomLevel(1); }}
              style={{
                position: "absolute",
                left: "24px",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "50%",
                color: "#fff",
                width: "48px",
                height: "48px",
                cursor: "pointer",
                zIndex: 100000,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s"
              }}
            >
              <Icon name="chevron_left" style={{ fontSize: "24px" }} />
            </button>
          )}

          {activeImageIndex < images.length - 1 && (
            <button
              onClick={() => { setActiveImageIndex(activeImageIndex + 1); setZoomLevel(1); }}
              style={{
                position: "absolute",
                right: "24px",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "50%",
                color: "#fff",
                width: "48px",
                height: "48px",
                cursor: "pointer",
                zIndex: 100000,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s"
              }}
            >
              <Icon name="chevron_right" style={{ fontSize: "24px" }} />
            </button>
          )}

          {/* Lightbox Image Viewport */}
          <div style={{
            overflow: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "90%",
            height: "80%"
          }}>
            <img
              src={imageUrls[images[activeImageIndex].id] || ""}
              alt="Expanded Preview"
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
                transform: `scale(${zoomLevel})`,
                transition: "transform 0.15s ease",
                boxShadow: "0 10px 30px rgba(0,0,0,0.5)"
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
