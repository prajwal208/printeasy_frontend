import React from "react";
import styles from "../../features/Main/ProductSection/ProductSection.module.scss";
import ProductCard from "../ProductCard/ProductCard";

const Suggested = ({ relatedData }) => {
  return (
    <>
      <div className={styles.wrapper}>
        <div className={styles.ymalHeader}>
          <div className={styles.ymalEyebrow}>CURATED FOR YOU</div>
          <div className={styles.ymalTitleRow}>
            <h2 className={styles.ymalTitle}>YOU MAY ALSO LIKE</h2>
            <button type="button" className={styles.ymalSeeAll}>
              See all →
            </button>
          </div>
          <div className={styles.ymalFilters}>
            {["All", "Animals", "Heroes", "Funny", "Anime"].map((t) => (
              <span key={t} className={styles.ymalFilter}>
                {t}
              </span>
            ))}
          </div>
        </div>

        <div className={styles.cardGrid}>
          {relatedData?.map((item) => (
            <ProductCard item={item} key={item.id} />
          ))}
        </div>
      </div>
    </>
  );
};

export default Suggested;
