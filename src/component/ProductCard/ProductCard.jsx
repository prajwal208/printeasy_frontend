"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import styles from "./ProductCard.module.scss";
import { Heart } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import api from "@/axiosInstance/axiosInstance";

const ProductCard = ({ item, getwishList }) => {
  const [liked, setLiked] = useState(false);
  const router = useRouter();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const pathname = usePathname();
  const handleClick = () => {
    router.push(`/product/${item?.slug}`);
  };

  useEffect(() => {
    if (pathname === "/wishlist") {
      const fetchWishlistStatus = async () => {
        try {
          const res = await api.get(`${apiUrl}/v2/wishlist/${item.id}/status`, {
            headers: {
              "x-api-key":
                "454ccaf106998a71760f6729e7f9edaf1df17055b297b3008ff8b65a5efd7c10",
            },
          });
          setLiked(res.data?.data?.isInWishlist || false);
        } catch (err) {
          console.error("Error checking wishlist status:", err);
        }
      };

      fetchWishlistStatus();
    }
  }, [apiUrl, item.id, pathname]);

  const toggleWishlist = async () => {
    try {
      if (!liked) {
        await api.post(
          `${apiUrl}/v2/wishlist`,
          { productId: item.id },
          {
            headers: {
              "x-api-key":
                "454ccaf106998a71760f6729e7f9edaf1df17055b297b3008ff8b65a5efd7c10",
            },
          }
        );
      } else {
        const res = await api.delete(`${apiUrl}/v2/wishlist/${item.id}`, {
          headers: {
            "x-api-key":
              "454ccaf106998a71760f6729e7f9edaf1df17055b297b3008ff8b65a5efd7c10",
          },
        });
        if (res?.status === 200) {
          getwishList();
        }
      }

      setLiked((prev) => !prev);
    } catch (error) {
      console.error("Error toggling wishlist:", error);
    }
  };

  const discountPercentage =
    item?.basePrice && item?.discountedPrice
      ? Math.round(((item.basePrice - item.discountedPrice) / item.basePrice) * 100)
      : 0;

  const cardImageSrc =
    item?.productImages?.[1] ??
    item?.productImages?.[0] ??
    item?.productImageUrl ??
    item?.imageUrl ??
    item?.image ??
    "";

  return (
    <article className={styles.card} onClick={handleClick} role="button" tabIndex={0}>
      <div className={styles.media}>
        <Image
          src={cardImageSrc}
          alt={item?.name}
          className={styles.mediaImg}
          fill
        />

        <div className={styles.badges}>
          {item?.isTrending ? (
            <span className={`${styles.badge} ${styles.badgeHot}`}>🔥 TRENDING</span>
          ) : null}
          {discountPercentage > 0 ? (
            <span className={`${styles.badge} ${styles.badgeOff}`}>
              {discountPercentage}% OFF
            </span>
          ) : null}
        </div>

        {pathname === "/wishlist" ? (
          <button
            type="button"
            className={`${styles.wishBtn} ${liked ? styles.wishBtnLiked : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              toggleWishlist();
            }}
            aria-label={liked ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart
              size={16}
              fill={liked ? "#ff4500" : "none"}
              stroke={liked ? "#ff4500" : "#ffffff"}
              strokeWidth={2}
            />
          </button>
        ) : null}
      </div>

      <div className={styles.body}>
        <h3 className={styles.name}>{item?.name}</h3>

        <div className={styles.metaRow}>
          {item?.rating ? (
            <>
              <span className={styles.stars}>★★★★★</span>
              <span className={styles.ratingNum}>{item.rating}</span>
              {item?.ratingCount ? (
                <span className={styles.ratingCnt}>({item.ratingCount})</span>
              ) : null}
            </>
          ) : null}
        </div>

        <div className={styles.priceRow}>
          <span className={styles.price}>₹{item?.discountedPrice}</span>
          {item?.basePrice > item?.discountedPrice ? (
            <span className={styles.basePrice}>₹{item?.basePrice}</span>
          ) : null}
          {discountPercentage > 0 ? (
            <span className={styles.offPill}>{discountPercentage}% OFF</span>
          ) : null}
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
