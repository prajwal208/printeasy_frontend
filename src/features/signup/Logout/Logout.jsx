import React from 'react';
import styles from './logout.module.scss';

const Logout = ({ onCancel, onLogout }) => {
  return (
    <div className={styles.logoutContainer}>
      <h2 className={styles.logoutTitle}>Logout?</h2>
      <p className={styles.logoutMessage}>Are you sure you want to logout?</p>
      <div className={styles.logoutActions}>
        <button className={`${styles.btn} ${styles.btnCancel}`} onClick={onCancel}>
          No, Cancel
        </button>
        <button className={`${styles.btn} ${styles.btnLogout}`} onClick={onLogout}>
          Yes, Logout
        </button>
      </div>
    </div>
  );
};

export default Logout;