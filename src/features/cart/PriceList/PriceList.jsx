import React from "react";
import styles from "./pricelist.module.scss";
import { getApplicableRewards } from "@/lib/price";

const PriceList = ({ bagTotal, grandTotal, handlePayNow, offerData }) => {
  const { applicable, discount, freeDelivery } = getApplicableRewards(
    offerData,
    bagTotal
  );

  const shippingCost = freeDelivery ? 0 : 50;
  const finalPayable = (grandTotal + shippingCost - discount).toFixed(2);

  return (
    <div className={styles.priceDetails}>
      <div className={styles.priceHeader}>
        <h2>Order Summary</h2>
      </div>

      <div className={styles.priceContent}>
        {/* Bag Total */}
        <div className={styles.priceRow}>
          <span>Bag Total</span>
          <span>₹{bagTotal}</span>
        </div>

        <div className={styles.priceRow}>
          <span>Shipping</span>
          {freeDelivery ? (
            <span className={styles.freePriceWrapper}>
              <strong className={styles.discountText}>Free</strong>
              <span className={styles.strikeValue}>₹50</span>
            </span>
          ) : (
            <span>₹50</span>
          )}
        </div>

        {discount > 0 && (
          <div className={`${styles.priceRow} ${styles.discountRow}`}>
            <span>Discount Applied</span>
            <span>- ₹{discount.toFixed(2)}</span>
          </div>
        )}

        {/* Only One Final Payable */}
        <div className={styles.finalAmount}>
          <p>Total Payable</p>
          <p>₹{finalPayable}</p>
        </div>

        {applicable.length > 0 && (
          <div className={styles.rewardsApplied}>
            {applicable.map((reward) => (
              <p key={reward.id} className={styles.rewardRow}>
                {reward.title}
              </p>
            ))}
          </div>
        )}

        {/* Pay Button */}
        <button className={styles.payBtn} onClick={handlePayNow}>
          PAY ₹{finalPayable}
        </button>
      </div>
    </div>
  );
};

export default PriceList;
