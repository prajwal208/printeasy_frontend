"use client";
import axios from "axios";
import React, { useEffect, useState } from "react";
import styles from "./wishlist.module.scss";
import ProductCard from "@/component/ProductCard/ProductCard";
import api from "@/axiosInstance/axiosInstance";
import NoResult from "@/component/NoResult/NoResult";
import { useRouter } from "next/navigation";

const WishList = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const [wishlistData, setWishListData] = useState([]);
  const router = useRouter();

  const getwishList = async () => {
    try {
      const res = await api.get(`${apiUrl}/v2/wishlist`, {
        headers: {
          "x-api-key":
            "454ccaf106998a71760f6729e7f9edaf1df17055b297b3008ff8b65a5efd7c10",
        },
      });
      setWishListData(res?.data?.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getwishList();
  }, []);

  return (
    <>
      <main className={styles.wishlist_main}>

        {wishlistData?.length > 0 ? (
          <div className={styles.cardGrid}>
            {wishlistData.map((item) => (
              <ProductCard
                key={item.id}
                item={item}
                getwishList={getwishList}
              />
            ))}
          </div>
        ) : (
          <div className={styles.noProducts}>
            <NoResult
              title={"Your Wishlist is Empty"}
              description={
                "Looks like you haven’t added anything to your wishlist yet. Start exploring and save your favorite items to view them here later."
              }
              buttonText={"Explore Now"}
              onButtonClick={() => router.push("/")}
            />
          </div>
        )}
      </main>
    </>
  );
};

export default WishList;
