import React from 'react'
import styles from './pricelist.module.scss'

const PriceList = ({bagTotal,grandTotal,handlePayNow}) => {
  return (
    <>
       <div className={styles.priceDetails}>
              <div className={styles.priceHeader}>
                <h2>Price Details</h2>
              </div>

              <div className={styles.priceContent}>
                <div className={styles.priceRow}>
                  <span>Bag Total</span>
                  <span className={styles.priceValue}>₹{bagTotal}</span>
                </div>

                <div className={styles.priceRow}>
                  <span>Shipping</span>
                  <span className={styles.priceValue}>₹0</span>
                </div>

                <div className={styles.grandTotalRow}>
                  <span>Grand Total</span>
                  <span>₹{grandTotal}</span>
                </div>

                <button className={styles.payBtn} onClick={handlePayNow}>PAY ₹ {grandTotal}</button>
              </div>
            </div>
    </>
  )
}

export default PriceList
