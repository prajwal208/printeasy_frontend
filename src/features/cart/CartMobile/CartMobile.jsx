"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Heart } from "lucide-react";
import styles from "./cartMobile.module.scss";
import FOMO_USERS, { pickUsers, randomUser } from "@/data/fomoUsers";
import { getApplicableRewards } from "@/lib/price";
import { PAYMENT_METHOD, estimatePartialCodAmounts } from "@/lib/payment";
import { getCartItemAttributeTags } from "@/lib/cartItemMeta";

const COD_FEE = 49;

const formatINR = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const formatTwo = (n) => String(n).padStart(2, "0");

const initials = (name) => (name || "").trim().slice(0, 6) || "Friend";

const CartMobile = ({
  cartItems,
  bagTotal,
  offerData,
  paymentMethod,
  onPaymentMethodChange,
  hasCustomizable,
  isSubmitting,
  onPlaceOrder,
  onQuantityChange,
  onRemove,
  onWishlist,
  onBack,
  cartCount,
}) => {
  const router = useRouter();
  const { discount, freeDelivery } = useMemo(
    () => getApplicableRewards(offerData, bagTotal),
    [offerData, bagTotal]
  );

  const buyerAvatars = useMemo(() => pickUsers(3), []);

  const shippingCost = freeDelivery ? 0 : 50;
  const total = Number((bagTotal + shippingCost - discount).toFixed(2));
  const partial = estimatePartialCodAmounts(total);
  const codBalance = Math.max(0, total - partial.advanceAmount);
  const codDoorTotal = codBalance + COD_FEE;
  const savings = Math.max(0, 50 - shippingCost) + discount;

  /* ---------- COUNTDOWN ---------- */
  const [secs, setSecs] = useState(14 * 60 + 59);
  useEffect(() => {
    const id = setInterval(
      () => setSecs((s) => (s > 0 ? s - 1 : 0)),
      1000
    );
    return () => clearInterval(id);
  }, []);
  const mins = Math.floor(secs / 60);
  const ss = secs % 60;

  /* ---------- SLOTS (FOMO) ---------- */
  const TOTAL_SLOTS = 7;
  const [slots, setSlots] = useState(() => {
    const seeded = pickUsers(3);
    return [
      { state: "taken", user: seeded[0] },
      { state: "taken", user: seeded[1] },
      { state: "taken", user: seeded[2] },
      { state: "open", user: null },
      { state: "open", user: null },
      { state: "open", user: null },
      { state: "you", user: null },
    ];
  });
  const [toast, setToast] = useState(null);
  const [buyersLine, setBuyersLine] = useState(() => {
    const seeded = pickUsers(3);
    return `${seeded[0].name}, ${seeded[1].name}, ${seeded[2].name} got free personalisation today`;
  });
  const scheduleRef = useRef(null);
  const settleRef = useRef(null);
  const youClaimedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const claimNext = () => {
      if (cancelled) return;
      let hasOpen = false;
      let claimedUser = null;
      let claimedIdx = -1;

      setSlots((prev) => {
        const nextIdx = prev.findIndex((s) => s.state === "open");
        if (nextIdx === -1) return prev;
        const used = prev.map((s) => s.user?.name).filter(Boolean);
        const user = randomUser(used);
        hasOpen = true;
        claimedUser = user;
        claimedIdx = nextIdx;
        return prev.map((s, i) =>
          i === nextIdx ? { state: "claiming", user } : s
        );
      });

      if (!hasOpen) return;

      settleRef.current = setTimeout(() => {
        if (cancelled) return;
        setSlots((curr) =>
          curr.map((s, i) =>
            i === claimedIdx ? { state: "taken", user: claimedUser } : s
          )
        );
        setToast(
          `${claimedUser.name} from ${claimedUser.city} just claimed free personalisation!`
        );
        setBuyersLine(
          `${claimedUser.name} from ${claimedUser.city} just grabbed free personalisation!`
        );

        scheduleRef.current = setTimeout(
          claimNext,
          6000 + Math.random() * 8000
        );
      }, 700);
    };

    scheduleRef.current = setTimeout(
      claimNext,
      6000 + Math.random() * 4000
    );

    return () => {
      cancelled = true;
      clearTimeout(scheduleRef.current);
      clearTimeout(settleRef.current);
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(id);
  }, [toast]);

  const takenCount = slots.filter((s) => s.state === "taken").length;
  const claimedRatio = Math.round((takenCount / TOTAL_SLOTS) * 100);
  const openLeft = slots.filter((s) => s.state === "open").length;
  const slotsLeftLabel =
    openLeft <= 0 ? "last slot" : `${openLeft} ${openLeft === 1 ? "slot" : "slots"}`;

  const claimOffer = () => {
    setToast("🎉 Free personalisation applied! Complete your order.");
    if (youClaimedRef.current) return;
    youClaimedRef.current = true;
    setSlots((prev) =>
      prev.map((s, i) => (i === 6 ? { ...s, state: "claimed" } : s))
    );
    setTimeout(() => {
      setSlots((prev) =>
        prev.map((s, i) => (i === 6 ? { ...s, state: "you" } : s))
      );
    }, 1500);
  };

  /* ---------- PAYMENT COPY ---------- */
  const payCtaLabel =
    paymentMethod === PAYMENT_METHOD.PARTIAL_COD
      ? "Book Now"
      : paymentMethod === PAYMENT_METHOD.COD
      ? "Place Order"
      : "Proceed to Pay";

  const payCtaSub =
    paymentMethod === PAYMENT_METHOD.PARTIAL_COD
      ? "Book now · Pay rest at door"
      : paymentMethod === PAYMENT_METHOD.COD
      ? "Pay cash on delivery"
      : "Pay Online · Total";

  const payCtaAmount =
    paymentMethod === PAYMENT_METHOD.PARTIAL_COD
      ? formatINR(partial.advanceAmount)
      : formatINR(total);

  /* ---------- RENDER HELPERS ---------- */
  const renderSlot = (s, idx) => {
    if (idx === 6) {
      if (s.state === "claimed") {
        return (
          <div key={idx} className={`${styles.slot} ${styles.slotClaimed}`}>
            <div className={styles.sStar}>✓</div>
            <div className={`${styles.sName} ${styles.sNameYou}`}>YOU</div>
          </div>
        );
      }
      return (
        <div key={idx} className={`${styles.slot} ${styles.slotYou}`}>
          <div className={styles.sStar}>★</div>
          <div className={`${styles.sName} ${styles.sNameYou}`}>YOU</div>
        </div>
      );
    }
    if (s.state === "taken") {
      return (
        <div key={idx} className={`${styles.slot} ${styles.slotTaken}`}>
          <div className={styles.sX}>✕</div>
          <div className={styles.sName}>{initials(s.user?.name)}</div>
        </div>
      );
    }
    if (s.state === "claiming") {
      return (
        <div key={idx} className={`${styles.slot} ${styles.slotClaiming}`}>
          <div className={styles.sStar}>✓</div>
          <div className={`${styles.sName} ${styles.sNameClaim}`}>
            {initials(s.user?.name)}
          </div>
        </div>
      );
    }
    return (
      <div key={idx} className={`${styles.slot} ${styles.slotOpen}`}>
        <div className={styles.sDot} />
        <div className={`${styles.sName} ${styles.sNameOpen}`}>Open</div>
      </div>
    );
  };

  return (
    <div className={styles.mobileCart}>
      {/* NAV */}
      <div className={styles.nav}>
        <button className={styles.navBack} onClick={onBack} aria-label="Back">
          <ChevronLeft size={18} />
        </button>
        <div className={styles.navTitle}>
          <span>ON</span>RISE — MY CART
        </div>
        <div className={styles.navBadge}>
          {cartCount} {cartCount === 1 ? "Item" : "Items"}
        </div>
      </div>

      {/* REWARDS */}
      <div className={styles.rw}>
        <div className={styles.rwTitle}>🎁 Unlock Rewards with Your Orders</div>
        <div className={styles.rwTrack}>
          <div className={styles.rwBg} />
          <div
            className={styles.rwFill}
            style={{ width: `${Math.min(100, claimedRatio)}%` }}
          />
          <div className={styles.rwDots}>
            <div className={styles.rwDot}>
              <div className={styles.rwCircle}>🛒</div>
              <div className={styles.rwLbl}>START</div>
            </div>
            <div className={styles.rwDot}>
              <div className={styles.rwCircle}>🚚</div>
              <div className={styles.rwLbl}>₹500</div>
            </div>
            <div className={styles.rwDot}>
              <div className={styles.rwCircle}>🏷️</div>
              <div className={styles.rwLbl}>₹600</div>
            </div>
            <div className={styles.rwDot}>
              <div className={styles.rwCircle}>🎁</div>
              <div className={styles.rwLbl}>₹900</div>
            </div>
          </div>
        </div>
        <div className={styles.rwStatus}>
          {freeDelivery && discount > 0
            ? "🎉 All rewards unlocked!"
            : freeDelivery
            ? "🚚 Free shipping unlocked"
            : "Keep shopping to unlock rewards"}
        </div>
      </div>

      {/* MARQUEE */}
      <div className={styles.mq}>
        <div className={styles.mqInner}>
          {[0, 1].map((dup) => (
            <span key={dup} className={styles.mqGroup}>
              <span className={styles.mqT}>✦ FREE PERSONALISATION</span>
              <span className={styles.mqD} />
              <span className={styles.mqT}>THEIR WORD. YOUR LOVE. FREE TODAY</span>
              <span className={styles.mqD} />
              <span className={styles.mqT}>⚡ ONLY {openLeft || 1} SLOTS LEFT</span>
              <span className={styles.mqD} />
            </span>
          ))}
        </div>
      </div>

      {/* FOMO CARD */}
      <div className={styles.fc}>
        <div className={styles.fcInner}>
          <div className={styles.fcEye}>
            <div className={styles.fcDot} />
            <div className={styles.fcLive}>Live Offer · Ends Soon</div>
            <div className={styles.fcSite}>onrise.in</div>
          </div>

          <div className={styles.fcProof}>
            <span className={styles.fcProofIcon}>❤️</span>
            <span className={styles.fcProofTxt}>
              Trusted by <strong>2,000+ happy parents</strong>{" "}
              across India
            </span>
          </div>

          <div className={styles.fcTop}>
            <div className={styles.fcH}>
              <div className={styles.fcHW}>YOU KNOW THEM</div>
              <div className={styles.fcHO}>BETTER THAN</div>
              <div className={styles.fcHG}>ANYONE DOES ✦</div>
            </div>
            <div className={styles.fcCd}>
              <div className={styles.fcCdLbl}>Ends in</div>
              <div className={styles.fcCdBoxes}>
                <div className={styles.fcCdBox}>
                  <span className={styles.fcCdNum}>{formatTwo(mins)}</span>
                  <span className={styles.fcCdUnit}>min</span>
                </div>
                <div className={styles.fcCdSep}>:</div>
                <div className={styles.fcCdBox}>
                  <span className={styles.fcCdNum}>{formatTwo(ss)}</span>
                  <span className={styles.fcCdUnit}>sec</span>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.fcSub}>
            Only you know the perfect word for them.{" "}
            <strong>Claim it free before this batch closes</strong> —{" "}
            <span>{slotsLeftLabel}</span> left.
          </div>

          <div className={styles.slotsWrap}>{slots.map(renderSlot)}</div>

          <div className={styles.slotsMeta}>
            <div className={styles.slotsCount}>
              <span>{takenCount}</span>/{TOTAL_SLOTS} claimed
            </div>
            <div className={styles.slotsBarW}>
              <div
                className={styles.slotsBar}
                style={{ width: `${claimedRatio}%` }}
              />
            </div>
          </div>

          <button
            type="button"
            className={styles.fcCta}
            onClick={claimOffer}
          >
            <div>
              <div className={styles.ctaT}>Claim FREE Personalisation</div>
              <div className={styles.ctaS}>
                Auto-applied at checkout · ₹99 value yours free
              </div>
            </div>
            <div className={styles.ctaPill}>₹0</div>
          </button>
        </div>

        <div className={styles.buyers}>
          <div className={styles.bAvs}>
            {buyerAvatars.map((u, i) => (
              <div
                key={i}
                className={styles.bAv}
                style={{ background: u.color }}
              >
                {u.emoji}
              </div>
            ))}
          </div>
          <div className={styles.bTxt}>{buyersLine}</div>
        </div>
      </div>

      {/* OFFER STRIP */}
      {(freeDelivery || discount > 0) && (
        <div className={styles.os}>
          <span className={styles.osIcon}>🏷️</span>
          <div className={styles.osTxt}>
            {discount > 0 && (
              <>
                <span className={styles.osHighlight}>
                  {formatINR(discount)} OFF
                </span>{" "}
                applied{freeDelivery ? " · " : ""}
              </>
            )}
            {freeDelivery && <>Free shipping unlocked 🚚</>}
          </div>
          <span className={styles.osChev}>›</span>
        </div>
      )}

      {/* ITEMS */}
      <div className={styles.sec}>
        Your Items
        <span className={styles.secCount}>
          {cartCount} {cartCount === 1 ? "shirt" : "shirts"}
        </span>
      </div>

      {cartItems.map((item) => {
        const presetText = item?.presetText;
        const attributeTags = getCartItemAttributeTags(item);
        const basePrice = Number(item?.basePrice) || 0;
        const discPrice = Number(item?.discountPrice) || basePrice;
        const save = Math.max(0, basePrice - discPrice) * (item.quantity || 1);

        return (
          <div key={item.id} className={styles.ci}>
            <div className={styles.ciTop}>
              <div className={styles.ciImg}>
                {item.productImageUrl ? (
                  <img src={item.productImageUrl} alt={item.name} />
                ) : (
                  <div className={styles.ciEmoji}>🎽</div>
                )}
                {item.isCustomizable && (
                  <div className={styles.ciBadge}>PERSONALISED</div>
                )}
              </div>
              <div className={styles.ciInfo}>
                <div className={styles.ciName}>{item.name}</div>
                {presetText && presetText !== "Empty Text" && (
                  <div className={styles.ciWord}>
                    <span className={styles.ciWordStar}>✦</span>
                    <span className={styles.ciWordLbl}>
                      {String(presetText).toUpperCase()}
                    </span>
                  </div>
                )}
                {attributeTags.length > 0 ? (
                  <div className={styles.ciTags}>
                    {attributeTags.map((tag) => (
                      <span key={tag.key} className={styles.ciTag}>
                        {tag.label}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
              <div className={styles.ciR}>
                {basePrice > discPrice && (
                  <div className={styles.ciOld}>₹{basePrice}</div>
                )}
                <div className={styles.ciPrice}>₹{discPrice}</div>
                {save > 0 && (
                  <div className={styles.ciSave}>Save ₹{save}</div>
                )}
              </div>
            </div>

            <div className={styles.ciBot}>
              <div className={styles.ciActs}>
                <button
                  type="button"
                  className={styles.ciWish}
                  onClick={() => onWishlist(item.productId)}
                >
                  <Heart size={14} fill="#ff4500" strokeWidth={0} />
                  Wishlist
                </button>
                <button
                  type="button"
                  className={styles.ciDel}
                  onClick={() => onRemove(item.productId)}
                  aria-label="Remove item"
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14H6L5 6" />
                    <path d="M10 11v6M14 11v6" />
                    <path d="M9 6V4h6v2" />
                  </svg>
                </button>
              </div>

              <div className={styles.ciQty}>
                <button
                  type="button"
                  className={styles.qBtn}
                  onClick={() =>
                    onQuantityChange(item.id, (item.quantity || 1) - 1)
                  }
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <div className={styles.qN}>{item.quantity || 1}</div>
                <button
                  type="button"
                  className={styles.qBtn}
                  onClick={() =>
                    onQuantityChange(item.id, (item.quantity || 1) + 1)
                  }
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {/* ORDER SUMMARY */}
      <div className={styles.sec}>Order Summary</div>
      <div className={styles.sum}>
        <div className={styles.sumRows}>
          <div className={styles.sumRow}>
            <div className={styles.sl}>
              Bag Total ({cartCount} {cartCount === 1 ? "item" : "items"})
            </div>
            <div className={styles.sv}>{formatINR(bagTotal)}</div>
          </div>
          <div className={styles.sumRow}>
            <div className={styles.sl}>Shipping</div>
            <div className={styles.sv}>
              {freeDelivery ? (
                <>
                  <span className={styles.svStrike}>₹50</span>
                  &nbsp;
                  <span className={`${styles.sv} ${styles.svGreen}`}>
                    FREE 🎉
                  </span>
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
          <div className={styles.stV}>{formatINR(total)}</div>
        </div>
        <div className={styles.sumTax}>
          Inclusive of all taxes · No hidden charges at door
        </div>
      </div>

      {/* PAYMENT */}
      <div className={styles.paySec}>
        <div className={styles.payLbl}>Payment Method</div>
        <div className={styles.payOpts}>
          <button
            type="button"
            className={`${styles.payOpt} ${
              paymentMethod === PAYMENT_METHOD.ONLINE ? styles.payOptSel : ""
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
            <div className={styles.piPrice}>{formatINR(total)}</div>
          </button>

          <button
            type="button"
            className={`${styles.payOpt} ${
              paymentMethod === PAYMENT_METHOD.PARTIAL_COD
                ? styles.payOptSel
                : ""
            }`}
            onClick={() => onPaymentMethodChange(PAYMENT_METHOD.PARTIAL_COD)}
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
              <div className={styles.piPrice}>{formatINR(total)}</div>
            </button>
          )}
        </div>
      </div>

      {/* COD BREAKDOWN */}
      {paymentMethod === PAYMENT_METHOD.PARTIAL_COD && (
        <div className={`${styles.cod} ${styles.codShow}`}>
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
              <div className={styles.codRv}>{formatINR(total)}</div>
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

      {/* TRUST ROW */}
      <div className={styles.tr}>
        <div className={styles.trI}>
          <div className={styles.trIc}>🔒</div>
          <div className={styles.trT}>100% Secure</div>
          <div className={styles.trS}>Cashfree powered</div>
        </div>
        <div className={styles.trI}>
          <div className={styles.trIc}>🎁</div>
          <div className={styles.trT}>Made Only for You</div>
          <div className={styles.trS}>Personalised &amp; packed with love</div>
        </div>
        <div className={styles.trI}>
          <div className={styles.trIc}>⚡</div>
          <div className={styles.trT}>Ships in 4 Days</div>
          <div className={styles.trS}>Pan India delivery</div>
        </div>
      </div>

      {/* INFO CARDS */}
      <div className={styles.icWrap}>
        <div className={`${styles.ic} ${styles.icHappy}`}>
          <div className={`${styles.icIcon} ${styles.icIconH}`}>🏆</div>
          <div className={styles.icBody}>
            <div className={styles.icTitle}>
              2,000+ Happy Parents
            </div>
            <div className={styles.icSub}>
              Families across India trust Onrise for personalised kids&apos;
              clothing. Every order made with love and checked before shipping.
            </div>
          </div>
          <div className={`${styles.icBdg} ${styles.icBdgO}`}>★ 4.9</div>
        </div>

        <div className={`${styles.ic} ${styles.icRet}`}>
          <div className={`${styles.icIcon} ${styles.icIconR}`}>↩️</div>
          <div className={styles.icBody}>
            <div className={styles.icTitle}>8-Day Easy Returns</div>
            <div className={styles.icSub}>
              Not happy? Return or exchange within 8 days of delivery. No
              questions asked.
            </div>
          </div>
          <div className={`${styles.icBdg} ${styles.icBdgG}`}>FREE</div>
        </div>

        <div className={`${styles.ic} ${styles.icWa}`}>
          <div className={`${styles.icIcon} ${styles.icIconW}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#25D366">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.549 4.107 1.51 5.843L.057 23.428a.5.5 0 0 0 .609.61l5.7-1.476A11.952 11.952 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.006-1.374l-.36-.213-3.722.964.992-3.617-.233-.373A9.818 9.818 0 1 1 12 21.818z" />
            </svg>
          </div>
          <div className={styles.icBody}>
            <div className={styles.icTitle}>WhatsApp Confirmation</div>
            <div className={styles.icSub}>
              After ordering you&apos;ll receive a WhatsApp message confirming
              your child&apos;s name, design &amp; delivery date. Production
              starts only after your confirmation.
            </div>
          </div>
        </div>
      </div>

      {/* WA ENQUIRY */}
      <a
        className={styles.waBtn}
        href="https://wa.me/919019909704?text=Hi%2C%20I%20have%20an%20enquiry%20about%20my%20Onrise%20order"
        target="_blank"
        rel="noreferrer"
      >
        <div className={styles.waIc}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.549 4.107 1.51 5.843L.057 23.428a.5.5 0 0 0 .609.61l5.7-1.476A11.952 11.952 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.006-1.374l-.36-.213-3.722.964.992-3.617-.233-.373A9.818 9.818 0 1 1 12 21.818z" />
          </svg>
        </div>
        <div className={styles.waText}>
          <div className={styles.waT}>Any questions? Chat with us</div>
          <div className={styles.waS}>
            +91 90199 09704 · Usually replies in minutes
          </div>
        </div>
        <div className={styles.waA}>→</div>
      </a>

      <div className={styles.spacer} />

      <div className={styles.shopMoreFloat}>
        <span className={styles.shopMoreLbl}>Shop More</span>
        <button
          type="button"
          className={styles.shopMoreBtn}
          onClick={() => router.push("/")}
          aria-label="Shop more products"
        >
          <svg
            width="30"
            height="30"
            viewBox="0 0 32 32"
            fill="none"
            aria-hidden
          >
            <path
              d="M8 10h16l-1.5 14H9.5L8 10z"
              fill="#5B9BD5"
              stroke="#4A8BC4"
              strokeWidth="0.5"
            />
            <path
              d="M12 10V8a4 4 0 0 1 8 0v2"
              stroke="#4A8BC4"
              strokeWidth="1.5"
              fill="none"
            />
            <rect x="18" y="16" width="10" height="12" rx="2" fill="#FF4500" />
            <path
              d="M21 16v-2a2 2 0 0 1 4 0v2"
              stroke="#E63E00"
              strokeWidth="1"
              fill="none"
            />
          </svg>
        </button>
      </div>

      {/* STICKY FOOTER */}
      <div className={styles.sticky}>
        <div className={styles.brandTrust}>
          <div className={styles.btLock}>🔒</div>
          <div className={styles.btTxt}>
            Onrise is a <span className={styles.pe}>PrintEasy</span> brand
            &nbsp;·&nbsp;
            <strong>Trusted by 2,000+ families</strong>{" "}
            &nbsp;·&nbsp; Safe &amp; secure checkout
          </div>
        </div>
        {savings > 0 && (
          <div className={styles.svPill}>
            <div className={styles.svPillIn}>
              🎉 You&apos;re saving {formatINR(savings)} on this order
            </div>
          </div>
        )}
        <button
          type="button"
          className={styles.coBtn}
          onClick={() => onPlaceOrder(paymentMethod, total)}
          disabled={isSubmitting}
        >
          <div className={styles.coL}>
            <div className={styles.coSub}>
              {isSubmitting ? "Processing..." : payCtaSub}
            </div>
            <div className={styles.coAmt}>{payCtaAmount}</div>
          </div>
          <div className={styles.coR}>
            <div className={styles.coLbl}>
              {isSubmitting ? "Please wait" : payCtaLabel}
            </div>
            <div className={styles.coArr}>→</div>
          </div>
        </button>
      </div>

      {toast && (
        <div className={`${styles.toast} ${styles.toastShow}`}>
          <div className={styles.toastDot} />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
};

export default CartMobile;
