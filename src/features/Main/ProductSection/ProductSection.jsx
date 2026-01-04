"use client";

import React, { useEffect, useRef, useState } from "react";
import styles from "./ProductSection.module.scss";
import ProductCard from "@/component/ProductCard/ProductCard";
import axios from "axios";
import api from "@/axiosInstance/axiosInstance";
import ProductCardShimmer from "@/component/ProductShimmer/ProductShimmer";

const ProductSection = () => {
  const [categoryList, setCategoryList] = useState([]);
  const [filter, setFilter] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(
    "KjYkkJYBXXwIBXnpIgCg"
  );

  const [page, setPage] = useState(1);
  const limit = 20;
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const loadMoreRef = useRef(null);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const getData = async () => {
    try {
      const res = await axios.get(`${apiUrl}/v1/categories/all`, {
        headers: {
          "x-api-key":
            "454ccaf106998a71760f6729e7f9edaf1df17055b297b3008ff8b65a5efd7c10",
        },
      });

      setFilter(res?.data?.data?.[0]?.collections || []);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  /* ---------------- FETCH PRODUCTS ---------------- */
  const getCategoryListData = async (
    categoryId = selectedCategory,
    pageNumber = 1
  ) => {
    if (loading || !hasMore) return;

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

      setCategoryList((prev) =>
        pageNumber === 1 ? newProducts : [...prev, ...newProducts]
      );

      if (newProducts.length < limit) {
        setHasMore(false);
      }

      setPage(pageNumber);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- CATEGORY CHANGE ---------------- */
  const handleCategoryChange = (id) => {
    setSelectedCategory(id);
    setCategoryList([]);
    setPage(1);
    setHasMore(true);
    getCategoryListData(id, 1);
  };

  /* ---------------- INTERSECTION OBSERVER ---------------- */
  useEffect(() => {
    if (!loadMoreRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          getCategoryListData(selectedCategory, page + 1);
        }
      },
      { threshold: 1 }
    );

    observer.observe(loadMoreRef.current);

    return () => observer.disconnect();
  }, [page, hasMore, loading, selectedCategory]);

  /* ---------------- INITIAL LOAD ---------------- */
  useEffect(() => {
    getData();
    getCategoryListData(selectedCategory, 1);
  }, []);

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.heading}>NEW AND POPULAR</h2>

      {/* FILTERS */}
      <div className={styles.filters}>
        {filter?.map((cat) => (
          <button
            key={cat.id}
            className={`${styles.filterBtn} ${
              selectedCategory === cat.id ? styles.active : ""
            }`}
            onClick={() => handleCategoryChange(cat.id)}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* PRODUCTS */}
      <div className={styles.cardGrid}>
        {categoryList.length > 0
          ? categoryList.map((item) => (
              <ProductCard key={item.id} item={item} />
            ))
          : !loading && <p className={styles.noProducts}>No products found.</p>}
      </div>

      <div ref={loadMoreRef} style={{ height: "1px" }} />

      {loading && (
        <div className={styles.cardGrid}>
          {Array.from({ length: 4 }).map((_, index) => (
            <ProductCardShimmer key={index} />
          ))}
        </div>
      )}

      {!hasMore && categoryList.length > 0 && (
        <p style={{ textAlign: "center", margin: "20px 0" }}>
          No more products
        </p>
      )}
    </div>
  );
};

export default ProductSection;
