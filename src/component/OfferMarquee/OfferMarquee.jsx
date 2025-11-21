"use client";
import React, { useEffect, useState } from "react";
import styles from "./OfferMarquee.module.scss";
import api from "@/axiosInstance/axiosInstance";

const OfferMarquee = () => {
  const [offerData,setOfferData]= useState([]);

  const getOfferData = async () => {
    try {
      const res = await api.get(`/v2/promo-headline`, {
        headers: {
          "x-api-key":
            "454ccaf106998a71760f6729e7f9edaf1df17055b297b3008ff8b65a5efd7c10",
        },
      });
    setOfferData(res?.data?.data)
    } catch (err) {
      console.error("Error fetching banner images:", err);
    }
  };

  console.log(offerData,"sjsjsuyy")

  useEffect(() => {
    getOfferData()
  },[])


  return (
    <div className={styles.marqueeWrapper}>
      <div className={styles.marqueeContent}>
        {offerData
          .filter((item) => item.isActive)
          .map((item) => (
            <span key={item.id} className={styles.marqueeItem}>
              {item.headline}
            </span>
          ))}

        {/* Duplicate for seamless looping */}
        {offerData
          .filter((item) => item.isActive)
          .map((item) => (
            <span key={item.id + "_clone"} className={styles.marqueeItem}>
              {item.headline}
            </span>
          ))}
      </div>
    </div>
  );
};

export default OfferMarquee;
