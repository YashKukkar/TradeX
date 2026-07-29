import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import styles from "./Modal.module.css";
import Icon from "./Icon";
import { useRegisterOverlay } from "../context/OverlayContext";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  size?: "sm" | "lg";
  closeBtnRef?: React.RefObject<HTMLButtonElement | null>;
  children: React.ReactNode;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  size = "sm",
  closeBtnRef,
  children,
}: ModalProps) {
  useRegisterOverlay("modal-" + (typeof title === "string" ? title.toLowerCase().replace(/\s+/g, "-") : "generic"), isOpen);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    // Prevent background scrolling
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalStyle;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const modalClass = `${styles.modal} ${
    size === "sm" ? styles.modalSmall : size === "lg" ? styles.modalLarge : ""
  }`;

  return createPortal(
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={modalClass} role="dialog" aria-modal="true">
        <button
          ref={closeBtnRef}
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Close modal"
        >
          <Icon name="close" />
        </button>

        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>

        <div className={styles.body}>{children}</div>
      </div>
    </div>,
    document.body
  );
}

