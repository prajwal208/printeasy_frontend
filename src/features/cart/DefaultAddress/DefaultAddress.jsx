"use client";
import React from "react";
import { MapPin, Plus } from "lucide-react";
import styles from "./DefaultAddress.module.scss";

const DefaultAddress = ({ addressList = [], onChange }) => {
  const defaultAddress = addressList.find(
    (addr) => addr.isDefault === true
  );

  // 🟠 No default address → Show Add Address
  // if (!defaultAddress) {
  //   return (
  //     <div className={styles.addressBox}>
  //       <div className={styles.addressContent}>
  //         <MapPin size={16} className={styles.icon} />
  //         <div className={styles.text}>
  //           <p className={styles.addressLine}>No address added</p>
  //           <p className={styles.cityState}>
  //             Please add a delivery address to continue
  //           </p>
  //         </div>
  //         <button className={styles.changeBtn} onClick={onChange}>
  //           Add Address
  //         </button>
  //       </div>
  //     </div>
  //   );
  // }

  // 🟢 Default address exists
  return (
    <div className={styles.addressBox}>
      <div className={styles.addressContent}>
        <MapPin size={16} className={styles.icon} />
        <div className={styles.text}>
          <p className={styles.addressLine}>{defaultAddress.line1}</p>
          {defaultAddress.line2 && (
            <p className={styles.addressLine}>{defaultAddress.line2}</p>
          )}
          <p className={styles.cityState}>
            {defaultAddress.city}, {defaultAddress.state},{" "}
            {defaultAddress.country} {defaultAddress.pincode}
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
