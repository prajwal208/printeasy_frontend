import React from "react";
import Image from "next/image";
import styles from "./categoryCard.module.scss";

const CategoryCard = ({ image, title }) => {
  return (
    <div className={styles.card}>
      <Image src={image} alt={title} className={styles.image} width={100} height={100}/>
      <div className={styles.overlay}>
        <h3>{title}</h3>
      </div>
    </div>
  );
};

export default CategoryCard;
