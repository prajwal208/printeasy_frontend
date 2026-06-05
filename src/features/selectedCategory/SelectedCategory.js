"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import styles from "./selectedcategory.module.scss";
import { useParams } from "next/navigation";
import ProductCard from "@/component/ProductCard/ProductCard";
import api from "@/axiosInstance/axiosInstance";
import Header from "@/component/header/Header";
import ProductCardShimmer from "@/component/ProductShimmer/ProductShimmer";
import OfferMarquee from "@/component/OfferMarquee/OfferMarquee";
import HomeOfferDock from "@/component/HomeOfferDock/HomeOfferDock";

const LIMIT = 20;

const SelectedCategory = () => {
  const [categoryList, setCategoryList] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const observer = useRef(null);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const { slug } = useParams();

  // 🔹 Fetch products
  const getCategoryListData = async (pageNo) => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const res = await api.get(
        `${apiUrl}/v2/product/collections?categoryId=H8SZ4VfsFXa4C9cUeonB&identifier=${slug}&page=${pageNo}&limit=${LIMIT}`,
        {
          headers: {
            "x-api-key":
              "454ccaf106998a71760f6729e7f9edaf1df17055b297b3008ff8b65a5efd7c10",
          },
        }
      );

      const newData = res?.data?.data || [];

      setCategoryList((prev) => [...prev, ...newData]);

      if (newData.length < LIMIT) {
        setHasMore(false);
      }
    } catch (err) {
      console.error("Error fetching products", err);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Reset when slug changes
  useEffect(() => {
    setCategoryList([]);
    setPage(1);
    setHasMore(true);
  }, [slug]);

  // 🔹 Fetch data when page changes
  useEffect(() => {
    if (slug) {
      getCategoryListData(page);
    }
  }, [page, slug]);

  // 🔹 Intersection Observer
  const lastProductRef = useCallback(
    (node) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prev) => prev + 1);
        }
      });

      if (node) observer.current.observe(node);
    },
    [loading, hasMore]
  );

  return (
    <>
      <div className={styles.mobileHeader}>
        <Header />
      </div>

      <div className={styles.mobileOffer}>
        <OfferMarquee />
      </div>

      <div className={styles.pageWrap}>
        <div className={styles.cardGrid}>
          {categoryList.map((item, index) => {
            if (index === categoryList.length - 1) {
              return (
                <div ref={lastProductRef} key={item.id}>
                  <ProductCard item={item} />
                </div>
              );
            }
            return <ProductCard key={item.id} item={item} />;
          })}

          {loading &&
            Array.from({ length: 4 }).map((_, index) => (
              <ProductCardShimmer key={`shimmer-${index}`} />
            ))}
        </div>
      </div>

      <HomeOfferDock />
    </>
  );
};

export default SelectedCategory;
