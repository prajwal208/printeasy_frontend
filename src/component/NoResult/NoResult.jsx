import React from "react";
import styles from './noresult.module.scss'

const NoResult = ({title, description, buttonText, onButtonClick }) => {
  return (
    <>
      <div className={styles.emptyStateContainer}>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.description}>{description}</p>
        <button className={styles.button} onClick={onButtonClick}>
          {buttonText}
        </button>
      </div>
    </>
  );
};

export default NoResult;
