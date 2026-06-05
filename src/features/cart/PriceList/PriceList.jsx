import React from "react";
import styles from "./pricelist.module.scss";
import { getApplicableRewards } from "@/lib/price";
import { PAYMENT_METHOD, estimatePartialCodAmounts } from "@/lib/payment";

const COD_FEE = 49;

const formatINR = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const PriceList = ({
  bagTotal,
  grandTotal,
  paymentMethod,
  onPaymentMethodChange,
  onPlaceOrder,
  offerData,
  hasCustomizable,
  isSubmitting,
}) => {
  const { discount, freeDelivery } = getApplicableRewards(offerData, bagTotal);

  const shippingCost = freeDelivery ? 0 : 50;
  const finalPayable = Number(
    (grandTotal + shippingCost - discount).toFixed(2)
  );

  const partial = estimatePartialCodAmounts(finalPayable);
  const codBalance = Math.max(0, finalPayable - partial.advanceAmount);
  const codDoorTotal = codBalance + COD_FEE;
  const savings = Math.max(0, 50 - shippingCost) + Number(discount || 0);

  const ctaSub =
    paymentMethod === PAYMENT_METHOD.PARTIAL_COD
      ? "Book now · Pay rest at door"
      : paymentMethod === PAYMENT_METHOD.COD
      ? "Pay cash on delivery"
      : "Pay Online · Total";

  const ctaLabel =
    paymentMethod === PAYMENT_METHOD.PARTIAL_COD
      ? "Book Now"
      : paymentMethod === PAYMENT_METHOD.COD
      ? "Place Order"
      : "Proceed to Pay";

  const ctaAmount =
    paymentMethod === PAYMENT_METHOD.PARTIAL_COD
      ? formatINR(partial.advanceAmount)
      : formatINR(finalPayable);

  return (
    <div className={styles.rightCol}>
      {/* ORDER SUMMARY CARD */}
      <div className={styles.secLabel}>Order Summary</div>
      <div className={styles.sum}>
        <div className={styles.sumRows}>
          <div className={styles.sumRow}>
            <div className={styles.sl}>Bag Total</div>
            <div className={styles.sv}>{formatINR(bagTotal)}</div>
          </div>
          <div className={styles.sumRow}>
            <div className={styles.sl}>Shipping</div>
            <div className={styles.sv}>
              {freeDelivery ? (
                <>
                  <span className={styles.svStrike}>₹50</span>
                  &nbsp;
                  <span className={styles.svGreen}>FREE 🎉</span>
                </>
              ) : (
                "₹50"
              )}
            </div>
          </div>
          {discount > 0 && (
            <div className={styles.sumRow}>
              <div className={styles.sl}>Discount</div>
              <div className={`${styles.sv} ${styles.svGreen}`}>
                − {formatINR(discount)}
              </div>
            </div>
          )}
          <div className={styles.sdiv} />
        </div>
        <div className={styles.sumTot}>
          <div className={styles.stL}>Total</div>
          <div className={styles.stV}>{formatINR(finalPayable)}</div>
        </div>
        <div className={styles.sumTax}>
          Inclusive of all taxes · No hidden charges at door
        </div>
      </div>

      {/* PAYMENT METHOD CARD */}
      <div className={styles.paySec}>
        <div className={styles.payLbl}>Payment Method</div>
        <div className={styles.payOpts}>
          <button
            type="button"
            className={`${styles.payOpt} ${
              paymentMethod === PAYMENT_METHOD.ONLINE
                ? styles.payOptSel
                : ""
            }`}
            onClick={() => onPaymentMethodChange(PAYMENT_METHOD.ONLINE)}
          >
            <div className={styles.pr}>
              <div className={styles.prDot} />
            </div>
            <div className={`${styles.piWrap} ${styles.piWrapOn}`}>⚡</div>
            <div className={styles.pi}>
              <div className={styles.piRow}>
                <div className={styles.piName}>Pay Full Online</div>
                <div className={styles.piSave}>SAVE ₹{COD_FEE}</div>
              </div>
              <div className={styles.piSub}>
                UPI · Cards · Net Banking · Wallets
              </div>
            </div>
            <div className={styles.piPrice}>{formatINR(finalPayable)}</div>
          </button>

          <button
            type="button"
            className={`${styles.payOpt} ${
              paymentMethod === PAYMENT_METHOD.PARTIAL_COD
                ? styles.payOptSel
                : ""
            }`}
            onClick={() =>
              onPaymentMethodChange(PAYMENT_METHOD.PARTIAL_COD)
            }
          >
            <div className={styles.pr}>
              <div className={styles.prDot} />
            </div>
            <div className={`${styles.piWrap} ${styles.piWrapCo}`}>🚚</div>
            <div className={styles.pi}>
              <div className={styles.piRow}>
                <div className={styles.piName}>Book Now, Pay Later</div>
                <div className={styles.piPop}>POPULAR</div>
              </div>
              <div className={styles.piSub}>
                ₹{partial.advanceAmount} now + ₹{codBalance} cash on delivery
                <span className={styles.piCod}>
                  + ₹{COD_FEE} convenience fee included
                </span>
              </div>
            </div>
            <div className={styles.piPrice}>
              {formatINR(partial.advanceAmount)}
            </div>
          </button>

          {!hasCustomizable && (
            <button
              type="button"
              className={`${styles.payOpt} ${
                paymentMethod === PAYMENT_METHOD.COD ? styles.payOptSel : ""
              }`}
              onClick={() => onPaymentMethodChange(PAYMENT_METHOD.COD)}
            >
              <div className={styles.pr}>
                <div className={styles.prDot} />
              </div>
              <div className={`${styles.piWrap} ${styles.piWrapCo}`}>💵</div>
              <div className={styles.pi}>
                <div className={styles.piRow}>
                  <div className={styles.piName}>Cash on Delivery</div>
                </div>
                <div className={styles.piSub}>
                  Pay the full amount when your order arrives.
                </div>
              </div>
              <div className={styles.piPrice}>{formatINR(finalPayable)}</div>
            </button>
          )}
        </div>
      </div>

      {/* COD BREAKDOWN CARD */}
      {paymentMethod === PAYMENT_METHOD.PARTIAL_COD && (
        <div className={styles.cod}>
          <div className={styles.codHd}>
            <div className={styles.codIcon}>🚚</div>
            <div>
              <div className={styles.codTitle}>
                Book Now, Pay Later — Breakdown
              </div>
              <div className={styles.codSub}>
                What you pay now vs at your door
              </div>
            </div>
          </div>
          <div className={styles.codRows}>
            <div className={styles.codRow}>
              <div className={styles.codRl}>
                <span className={styles.codDt} />
                Order total
              </div>
              <div className={styles.codRv}>
                {formatINR(finalPayable)}
              </div>
            </div>
            <div className={styles.codRow}>
              <div className={styles.codRl}>
                <span className={styles.codDt} />
                Pay online now ({partial.advancePercent}%)
              </div>
              <div className={`${styles.codRv} ${styles.codRvOr}`}>
                {formatINR(partial.advanceAmount)}
              </div>
            </div>
            <div className={styles.codDiv} />
            <div className={styles.codRow}>
              <div className={styles.codRl}>
                <span className={styles.codDt} />
                Balance at door
              </div>
              <div className={styles.codRv}>{formatINR(codBalance)}</div>
            </div>
            <div className={styles.codRow}>
              <div className={styles.codRl}>
                <span className={styles.codDt} />
                convenience fee
              </div>
              <div className={`${styles.codRv} ${styles.codRvOr}`}>
                + ₹{COD_FEE}
              </div>
            </div>
          </div>
          <div className={styles.codTot}>
            <div className={styles.codTl}>Cash at door total</div>
            <div className={styles.codTv}>{formatINR(codDoorTotal)}</div>
          </div>
        </div>
      )}

      {/* SAVINGS PILL + CTA */}
      {savings > 0 && (
        <div className={styles.svPill}>
          <div className={styles.svPillIn}>
            🎉 You're saving {formatINR(savings)} on this order
          </div>
        </div>
      )}

      <button
        type="button"
        className={styles.coBtn}
        onClick={() => onPlaceOrder(paymentMethod, finalPayable)}
        disabled={isSubmitting}
      >
        <div className={styles.coL}>
          <div className={styles.coSub}>
            {isSubmitting ? "Processing..." : ctaSub}
          </div>
          <div className={styles.coAmt}>{ctaAmount}</div>
        </div>
        <div className={styles.coR}>
          <div className={styles.coLbl}>
            {isSubmitting ? "Please wait" : ctaLabel}
          </div>
          <div className={styles.coArr}>→</div>
        </div>
      </button>
    </div>
  );
};

export default PriceList;
