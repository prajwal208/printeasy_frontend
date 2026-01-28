"use client";

import React, { useEffect, useRef, useState } from "react";
import styles from "../../features/Main/ProductSection/ProductSection.module.scss";
import ProductCard from "@/component/ProductCard/ProductCard";
import ProductCardShimmer from "@/component/ProductShimmer/ProductShimmer";
import api from "@/axiosInstance/axiosInstance";



const YouMayLikeSection = ({
  categoryId,
  heading = "YOU MAY ALSO LIKE",
}) => {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const loadMoreRef = useRef(null);
  const limit = 20;

  /* ---------------- FETCH DATA ---------------- */
  const fetchProducts = async (pageNumber = 1) => {
    if (loading || !hasMore || !categoryId) return;

    try {
      setLoading(true);

      const res = await api.get(`/v2/product/collections`, {
        params: {
          categoryId: "H8SZ4VfsFXa4C9cUeonB",
          identifier: categoryId,
          page: pageNumber,
          limit,
        },
        headers: {
          "x-api-key":
            "454ccaf106998a71760f6729e7f9edaf1df17055b297b3008ff8b65a5efd7c10",
        },
      });

      const newProducts = res?.data?.data || [];

      setProducts((prev) =>
        pageNumber === 1 ? newProducts : [...prev, ...newProducts]
      );

      if (newProducts.length < limit) {
        setHasMore(false);
      }

      setPage(pageNumber);
    } catch (err) {
      console.error("Error fetching you may like products:", err);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- RESET ON CATEGORY CHANGE ---------------- */
  useEffect(() => {
    setProducts([]);
    setPage(1);
    setHasMore(true);

    if (categoryId) {
      fetchProducts(1);
    }
  }, [categoryId]);

  /* ---------------- INTERSECTION OBSERVER ---------------- */
  useEffect(() => {
    if (!loadMoreRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          fetchProducts(page + 1);
        }
      },
      { threshold: 1 }
    );

    observer.observe(loadMoreRef.current);

    return () => observer.disconnect();
  }, [page, hasMore, loading]);

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.heading}>{heading}</h2>

      <div className={styles.cardGrid}>
        {products.length > 0
          ? products.map((item) => (
              <ProductCard key={item.id} item={item} />
            ))
          : !loading && (
              <p className={styles.noProducts}>No products found.</p>
            )}
      </div>

      <div ref={loadMoreRef} style={{ height: "1px" }} />

      {loading && (
        <div className={styles.cardGrid}>
          {Array.from({ length: 4 }).map((_, index) => (
            <ProductCardShimmer key={index} />
          ))}
        </div>
      )}

      {!hasMore && products.length > 0 && (
        <p style={{ textAlign: "center", margin: "20px 0" }}>
          No more products
        </p>
      )}
    </div>
  );
};

export default YouMayLikeSection;
