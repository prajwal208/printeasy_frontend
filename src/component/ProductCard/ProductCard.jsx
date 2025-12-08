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
    router.push(`/product/${item?.id}`);
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
  }, [item.id, pathname]);

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

  const discountPercentage = Math.round(
    ((item?.basePrice - item?.discountedPrice) / item?.basePrice) * 100
  );

  return (
    <div className={styles.card} onClick={handleClick}>
      <div className={styles.imageContainer}>
        <Image
          src={item?.productImages[0]}
          alt={item?.name}
          className={styles.productImg}
          fill
        />
        {pathname === "/wishlist" && (
          <span
            className={`${styles.favorite} ${liked ? styles.liked : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              toggleWishlist();
            }}
          >
            <Heart
              size={22}
              fill={liked ? "red" : "none"}
              stroke={liked ? "red" : "currentColor"}
            />
          </span>
        )}
      </div>
      
      <h3>{item?.name}</h3>
      <p>
        ₹ {item?.discountedPrice}{" "}
        <span className={styles.basePrice}>₹ {item?.basePrice}</span>{" "}
        <span className={styles.discount}>{discountPercentage}% off</span>
      </p>
      <p>Incl all taxes</p>
    </div>
  );
};

export default ProductCard;
