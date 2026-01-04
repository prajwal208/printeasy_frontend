"use client";

import React from "react";
import { FaWhatsapp } from "react-icons/fa";
import styles from './whatsappfloat.module.scss'

const WhatsAppFloat = () => {
  const phoneNumber = "918310248294";

  const handleClick = () => {
    window.open(
      `https://wa.me/${phoneNumber}`,
      "_blank"
    );
  };

  return (
    <button className={styles.whatsappButton} onClick={handleClick}>
      <FaWhatsapp size={28} />
    </button>
  );
};

export default WhatsAppFloat;
