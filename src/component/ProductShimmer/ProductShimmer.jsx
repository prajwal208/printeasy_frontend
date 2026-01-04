import React from "react";
import styles from "./productshimmer.module.scss"

const ProductCardShimmer = () => {
  return (
    <div className={styles.card}>
      <div className={styles.image} />
      <div className={styles.content}>
        <div className={styles.lineShort} />
        <div className={styles.lineLong} />
      </div>
    </div>
  );
};

export default ProductCardShimmer;
