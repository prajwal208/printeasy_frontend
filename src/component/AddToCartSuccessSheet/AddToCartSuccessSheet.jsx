import React from "react";
import styles from "./AddToCartSuccessSheet.module.scss";
import { useRouter } from "next/navigation";
import Suggested from "../Suggested/Suggested";

const AddToCartSuccessSheet = ({relatedData}) => {
    const router = useRouter()

    const handleOnViewBag = () => {
        router.push('/cart')
    }

  return (
    <div className={styles.cartSuccessSheet}>
      <div className={styles.handle}></div>

      <div className={styles.message}>
        <span className={styles.icon}>🚚</span>
        <p>
          <strong>Added to bag!</strong>
        </p>
        <button className={styles.btn} onClick={handleOnViewBag}>
          VIEW BAG
        </button>
      </div>

      <div className={styles.suggestions}>
        <Suggested relatedData={relatedData}/>
      </div>
    </div>
  );
};

export default AddToCartSuccessSheet;
