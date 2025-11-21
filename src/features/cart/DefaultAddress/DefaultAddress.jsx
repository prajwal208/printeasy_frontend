"use client";
import React from "react";
import { MapPin } from "lucide-react";
import styles from "./DefaultAddress.module.scss";

const DefaultAddress = ({ addressList = [], onChange }) => {
  const defaultAddress = addressList.find((addr) => addr.isDefault === true);

  if (!defaultAddress) return null;

  return (
    <div className={styles.addressBox}>
      <div className={styles.addressContent}>
        <MapPin size={16} className={styles.icon} />
        <div className={styles.text}>
          <p className={styles.addressLine}>{defaultAddress.line1}</p>
          <p className={styles.addressLine}>{defaultAddress.line2}</p>
          <p className={styles.cityState}>
            {defaultAddress.city}, {defaultAddress.state}, {defaultAddress.country}{" "}
            {defaultAddress.pincode}
          </p>
        </div>
        <button className={styles.changeBtn} onClick={onChange}>
          Change
        </button>
      </div>
    </div>
  );
};

export default DefaultAddress;
