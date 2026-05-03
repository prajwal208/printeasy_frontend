"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronUp, Gift, Percent, Truck } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { db } from "@/lib/db";
import api from "@/axiosInstance/axiosInstance";
import BottomSheet from "@/component/BottomSheet/BottomSheet";
import {
  getNextUnlockableOffer,
  getOfferVisualUrl,
  offerMinOrderAmount,
  sumCartBagTotal,
} from "@/lib/price";
import styles from "./HomeOfferDock.module.scss";

const API_KEY =
  "454ccaf106998a71760f6729e7f9edaf1df17055b297b3008ff8b65a5efd7c10";

function ProgressRing({ progressPct, size = 44, stroke = 2.5, children }) {
  const c = size / 2;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const p = Math.min(100, Math.max(0, progressPct));
  const dash = (p / 100) * circ;

  return (
    <div className={styles.ringWrap} style={{ width: size, height: size }}>
      <svg width={size} height={size} className={styles.ringSvg} aria-hidden>
        <circle
          cx={c}
          cy={c}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.22)"
          strokeWidth={stroke}
        />
        <circle
          cx={c}
          cy={c}
          r={r}
          fill="none"
          stroke="#fff"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          transform={`rotate(-90 ${c} ${c})`}
        />
      </svg>
      <div className={styles.ringInner}>{children}</div>
    </div>
  );
}

export default function HomeOfferDock() {
  const router = useRouter();
  const { cartCount } = useCart();
  const [offers, setOffers] = useState([]);
  const [cartBagTotal, setCartBagTotal] = useState(0);
  const [cartItemQty, setCartItemQty] = useState(0);
  const [cartThumb, setCartThumb] = useState(null);
  const [showOfferSheet, setShowOfferSheet] = useState(false);

  const fetchOffers = useCallback(async () => {
    try {
      const res = await api.get(`/v2/giftreward`, {
        headers: { "x-api-key": API_KEY },
      });
      setOffers(res?.data?.data || []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const refreshCart = useCallback(async () => {
    const items = await db.cart.toArray();
    setCartBagTotal(sumCartBagTotal(items));
    const qty = items.reduce((n, it) => n + (Number(it.quantity) || 1), 0);
    setCartItemQty(qty);
    const first = items[0];
    setCartThumb(
      first?.renderedImageUrl ||
        first?.productImageUrl ||
        first?.fullProductUrl ||
        null
    );
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void fetchOffers();
    });
  }, [fetchOffers]);

  useEffect(() => {
    queueMicrotask(() => {
      void refreshCart();
    });
  }, [cartCount, refreshCart]);

  const nextUnlock = useMemo(
    () => getNextUnlockableOffer(offers, cartBagTotal),
    [offers, cartBagTotal]
  );
  const nextOffer = nextUnlock.nextOffer;
  const nextGiftType = nextOffer?.giftType ?? nextOffer?.gift_type;

  const circleOffer = useMemo(() => {
    return (
      nextOffer ??
      (offers?.length && nextUnlock.allUnlocked
        ? [...offers]
            .filter((o) => !Number.isNaN(offerMinOrderAmount(o)))
            .sort((a, b) => offerMinOrderAmount(b) - offerMinOrderAmount(a))[0] ??
          offers[0]
        : null)
    );
  }, [nextOffer, nextUnlock.allUnlocked, offers]);

  const freeDeliveryCircleIconUrl = useMemo(() => {
    return (
      getOfferVisualUrl(circleOffer) ??
      (offers?.length ? getOfferVisualUrl(offers[0]) : null)
    );
  }, [circleOffer, offers]);

  const circleGiftType =
    circleOffer?.giftType ?? circleOffer?.gift_type ?? nextGiftType;

  const nextOfferHeadline = useMemo(() => {
    const raw = nextOffer?.title?.trim();
    if (raw) return raw;
    if (!nextOffer) return null;
    if (nextGiftType === "freeDelivery") return "Free delivery";
    if (nextGiftType === "discount") return "Order discount";
    return "Reward";
  }, [nextOffer, nextGiftType]);

  const primaryEmptyLayout = useMemo(() => {
    if (nextGiftType === "freeDelivery" && nextOffer) {
      return "Unlock free delivery";
    }
    return (
      nextOfferHeadline ||
      (nextUnlock.hasAnyOffer ? "Unlock your next reward" : "Offers on your bag")
    );
  }, [nextGiftType, nextOffer, nextOfferHeadline, nextUnlock.hasAnyOffer]);

  const primaryWithCartLayout = useMemo(() => {
    return (
      nextOfferHeadline ||
      (nextUnlock.hasAnyOffer ? "Your next reward" : "Offers on your bag")
    );
  }, [nextOfferHeadline, nextUnlock.hasAnyOffer]);

  const ringProgressPct = useMemo(() => {
    if (nextUnlock.allUnlocked) return 100;
    const th = nextUnlock.nextThreshold;
    if (!th || th <= 0) return 0;
    return Math.min(100, (cartBagTotal / th) * 100);
  }, [nextUnlock.allUnlocked, nextUnlock.nextThreshold, cartBagTotal]);

  const hasCartItems = cartItemQty > 0;

  const subline = (() => {
    if (
      nextOffer &&
      nextUnlock.amountMore != null &&
      !nextUnlock.allUnlocked
    ) {
      return (
        <p className={styles.sub}>
          <span className={styles.subMuted}>Shop for </span>
          <span className={styles.subStrong}>₹{nextUnlock.amountMore}</span>
          <span className={styles.subMuted}> more to unlock</span>
        </p>
      );
    }
    if (nextUnlock.allUnlocked && nextUnlock.hasAnyOffer) {
      return (
        <p className={styles.sub}>
          <span className={styles.subMuted}>
            Your bag meets every offer tier
          </span>
        </p>
      );
    }
    return (
      <p className={styles.sub}>
        <span className={styles.subMuted}>Tap to view available offers</span>
      </p>
    );
  })();

  const renderIconInner = () => {
    if (freeDeliveryCircleIconUrl) {
      return (
        <Image
          src={freeDeliveryCircleIconUrl}
          alt=""
          width={44}
          height={44}
          className={styles.iconImg}
          unoptimized
        />
      );
    }
    return (
      <span className={styles.iconFallback}>
        {nextUnlock.allUnlocked ? (
          <Gift size={22} strokeWidth={2} />
        ) : circleGiftType === "freeDelivery" ? (
          <Truck size={22} strokeWidth={2} />
        ) : circleGiftType === "discount" ? (
          <Percent size={22} strokeWidth={2} />
        ) : (
          <Gift size={22} strokeWidth={2} />
        )}
      </span>
    );
  };

  return (
    <>
      <div className={styles.dock}>
        <div className={styles.inner}>
          {/* <h2 className={styles.sectionTitle}>Fashion Deals</h2> */}

          {!hasCartItems ? (
            <button
              type="button"
              className={styles.dockOfferCard}
              onClick={() => setShowOfferSheet(true)}
            >
              <span className={styles.offerTab}>
                Offers <ChevronUp size={14} strokeWidth={2.5} />
              </span>
              <div className={styles.cardInner}>
                <div className={styles.iconCircle} aria-hidden>
                  {renderIconInner()}
                </div>
                <div className={styles.textCol}>
                  <p
                    className={`${styles.title} ${styles.titleClamp}`}
                  >
                    {primaryEmptyLayout}
                  </p>
                  {subline}
                </div>
              </div>
            </button>
          ) : (
            <div className={styles.row}>
              <button
                type="button"
                className={styles.dockOfferCard}
                onClick={() => setShowOfferSheet(true)}
              >
                <span className={styles.offerTab}>
                  Offers <ChevronUp size={14} strokeWidth={2.5} />
                </span>
                <div className={styles.cardInner}>
                  <ProgressRing progressPct={ringProgressPct}>
                    <Gift size={18} strokeWidth={2} />
                  </ProgressRing>
                  <div className={styles.textCol}>
                    <p className={`${styles.title} ${styles.titleClamp}`}>
                      {primaryWithCartLayout}
                    </p>
                    {subline}
                  </div>
                </div>
              </button>

              <button
                type="button"
                className={styles.cartPill}
                onClick={() => router.push("/cart")}
              >
                <div className={styles.cartThumb}>
                  {cartThumb ? (
                    <Image
                      src={cartThumb}
                      alt=""
                      width={40}
                      height={40}
                      className={styles.cartThumbImg}
                      unoptimized
                    />
                  ) : (
                    <div className={styles.cartThumbPlaceholder}>Bag</div>
                  )}
                </div>
                <div className={styles.cartMeta}>
                  <p className={styles.cartLabel}>Cart</p>
                  <p className={styles.cartCount}>
                    {cartItemQty} {cartItemQty === 1 ? "item" : "items"}
                  </p>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      <BottomSheet
        open={showOfferSheet}
        onClose={() => setShowOfferSheet(false)}
      >
        <div className={styles.offerSheet}>
          <h3>Available Offers</h3>
          {offers?.map((item) => {
            const sheetImg = getOfferVisualUrl(item);
            return (
              <div key={item.id} className={styles.sheetOfferRow}>
                {sheetImg ? (
                  <div className={styles.offerSheetThumb}>
                    <Image
                      src={sheetImg}
                      alt=""
                      width={52}
                      height={52}
                      className={styles.offerSheetThumbImg}
                      unoptimized
                    />
                  </div>
                ) : null}
                <div className={styles.offerCardBody}>
                  <p className={styles.offerCardTitle}>{item.title}</p>
                  <span className={styles.offerMin}>
                    <strong>
                      Min Order ₹
                      {item.minOrderAmount ?? item.min_order_amount}
                    </strong>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </BottomSheet>
    </>
  );
}
