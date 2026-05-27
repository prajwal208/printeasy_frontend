"use client";

import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import styles from "../../features/Main/ProductSection/ProductSection.module.scss";
import ProductCard from "@/component/ProductCard/ProductCard";
import ProductCardShimmer from "@/component/ProductShimmer/ProductShimmer";
import api from "@/axiosInstance/axiosInstance";

const DEFAULT_COLLECTION_ID = "KjYkkJYBXXwIBXnpIgCg";
const API_KEY =
  "454ccaf106998a71760f6729e7f9edaf1df17055b297b3008ff8b65a5efd7c10";
const STORE_CATEGORY_ID = "H8SZ4VfsFXa4C9cUeonB";

const YouMayLikeSection = ({
  initialCollectionId,
  heading = "YOU MAY ALSO LIKE",
}) => {
  const [filters, setFilters] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(
    initialCollectionId || DEFAULT_COLLECTION_ID
  );
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const loadMoreRef = useRef(null);
  const limit = 20;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const fetchProducts = async (categoryId, pageNumber = 1) => {
    if (!categoryId || loading) return;
    if (pageNumber > 1 && !hasMore) return;

    try {
      setLoading(true);

      const res = await api.get(`/v2/product/collections`, {
        params: {
          categoryId: STORE_CATEGORY_ID,
          identifier: categoryId,
          page: pageNumber,
          limit,
        },
        headers: { "x-api-key": API_KEY },
      });

      const newProducts = res?.data?.data || [];

      setProducts((prev) =>
        pageNumber === 1 ? newProducts : [...prev, ...newProducts]
      );

      setHasMore(newProducts.length >= limit);
      setPage(pageNumber);
    } catch (err) {
      console.error("Error fetching you may like products:", err);
    } finally {
      setLoading(false);
    }
  };

  const getFilters = async () => {
    try {
      const res = await axios.get(`${apiUrl}/v1/categories/all`, {
        headers: { "x-api-key": API_KEY },
      });
      setFilters(res?.data?.data?.[0]?.collections || []);
    } catch (err) {
      console.error("Error fetching collection filters:", err);
    }
  };

  const handleCategoryChange = (id) => {
    setSelectedCategory(id);
    setProducts([]);
    setPage(1);
    setHasMore(true);
    fetchProducts(id, 1);
  };

  useEffect(() => {
    getFilters();
  }, []);

  useEffect(() => {
    const id = initialCollectionId || DEFAULT_COLLECTION_ID;
    setSelectedCategory(id);
    setProducts([]);
    setPage(1);
    setHasMore(true);
    fetchProducts(id, 1);
  }, [initialCollectionId]);

  useEffect(() => {
    if (!loadMoreRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          fetchProducts(selectedCategory, page + 1);
        }
      },
      { threshold: 1 }
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [page, hasMore, loading, selectedCategory]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.ymalHeader}>
        <div className={styles.ymalEyebrow}>CURATED FOR YOU</div>
        <div className={styles.ymalTitleRow}>
          <h2 className={styles.ymalTitle}>{heading}</h2>
        </div>

        {filters.length > 0 ? (
          <div className={styles.ymalFilters}>
            {filters.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`${styles.ymalFilter} ${
                  selectedCategory === cat.id ? styles.ymalFilterActive : ""
                }`}
                onClick={() => handleCategoryChange(cat.id)}
              >
                {cat.name}
              </button>
            ))}
          </div>
        ) : null}
      </div>

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
