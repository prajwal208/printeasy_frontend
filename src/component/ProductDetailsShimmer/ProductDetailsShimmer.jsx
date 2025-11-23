import React from "react";
import styles from "./ProductDetailsShimmer.module.scss";

const ProductDetailsShimmer = () => {
  return (
    <div className={styles.shimmerContainer}>
      <div className={styles.leftShimmer} />

      <div className={styles.rightShimmer}>
        <div className={styles.title} />
        <div className={styles.subtitle} />
        <div className={styles.price} />

        <div className={styles.sizeBox}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={styles.sizeItem} />
          ))}
        </div>

        <div className={styles.btnWrapper}>
          <div className={styles.btn} />
          <div className={styles.btn} />
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsShimmer;
