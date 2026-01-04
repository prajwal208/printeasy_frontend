import React, { useEffect, useState } from "react";
import styles from "./addtobagloader.module.scss";
import Lottie from "lottie-react";
import loader from "../../assessts/loader.json";

const AddToBagLoader = () => {
  const messages = [
    "Preparing your customized order...",
    "Almost there, preparing your style...",
    "Hold tight! Finalizing the product...",
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % messages.length);
    }, 1800);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.loaderWrapper}>
      <div style={{ width: 150, height: 150 }}>
        <Lottie animationData={loader} loop autoplay />
      </div>
      <p className={styles.text}>{messages[currentIndex]}</p>
    </div>
  );
};

export default AddToBagLoader;
