import React from "react";
import Icon from "./Icon";
import styles from "./SplitDrawerLayout.module.css";

interface SplitDrawerLayoutProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: React.ReactNode;
  leftPane: React.ReactNode;
  rightPane: React.ReactNode;
  width?: string;
}

export default function SplitDrawerLayout({
  isOpen,
  onClose,
  title,
  subtitle,
  leftPane,
  rightPane,
  width = "1050px",
}: SplitDrawerLayoutProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Background blur overlay */}
      <div className={styles.overlay} onClick={onClose} />

      {/* Sliding Drawer Container */}
      <aside
        className={styles.drawer}
        role="dialog"
        aria-modal="true"
        style={{ width, maxWidth: "100%" }}
      >
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>{title}</h2>
            {subtitle && <div className={styles.sub}>{subtitle}</div>}
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close drawer">
            <Icon name="close" style={{ fontSize: "18px" }} />
          </button>
        </div>

        {/* Split Grid Body */}
        <div className={styles.bodySplit}>
          <div className={styles.leftPane}>{leftPane}</div>
          <div className={styles.rightPane}>{rightPane}</div>
        </div>
      </aside>
    </>
  );
}
