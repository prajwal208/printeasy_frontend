"use client";
import { X } from "lucide-react";
import styles from "./bottomsheet.module.scss";

const BottomSheet = ({ open, onClose, children }) => {
  return (
    <div className={`${styles.overlay} ${open ? styles.show : ""}`} onClick={onClose}>
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <div className={styles.handle}></div>
        <button className={styles.closeBtn} onClick={onClose}>
          <X size={18} />
        </button>
        {children}
      </div>
    </div>
  );
};

export default BottomSheet;
