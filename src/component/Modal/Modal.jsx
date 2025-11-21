"use client";

import React from "react";
import styles from "./modal.module.scss";

const DynamicModal = ({ open, onClose, children }) => {
  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
      >
        <button className={styles.closeBtn} onClick={onClose}>
          x
        </button>

        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );
};

export default DynamicModal;
