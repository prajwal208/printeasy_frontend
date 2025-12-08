import React from "react";
import styles from "./suggested.module.scss";
import ProductCard from "../ProductCard/ProductCard";

const Suggested = ({ relatedData }) => {
  return (
    <>
      <main className={styles.suggested_main_wrap}>
        <h4>You may also like </h4>

        <section className={styles.related_list}>
          {relatedData?.map((item) => {
            return (
                <ProductCard item={item} key={item.id}/>
            );
          })}
        </section>
      </main>
    </>
  );
};

export default Suggested;
