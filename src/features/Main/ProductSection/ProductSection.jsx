"use client";

import React, { useEffect, useState } from "react";
import styles from "./ProductSection.module.scss";
import ProductCard from "@/component/ProductCard/ProductCard";
import axios from "axios";
import api from "@/axiosInstance/axiosInstance";

const ProductSection = () => {
  const [categoryList, setCategoryList] = useState([]);
  const [product, setProduct] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("aZRFftKgh2F1UedB02Uv");
  const [filter,setFilter]= useState([])
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const getData = async () => {
    try {
      const res = await axios.get(`${apiUrl}/v1/categories/all`, {
        headers: {
          "x-api-key":
            "454ccaf106998a71760f6729e7f9edaf1df17055b297b3008ff8b65a5efd7c10",
        },
      });
      setFilter(res?.data?.data?.[0].collections || []);
    } catch (err) {
      console.error("Error fetching categories:", err);
    } finally {
      setLoading(false); // 🔹 stop loader
    }
  };


  const getCategoryListData = async (id) => {
    const res = await api.get(
      `${apiUrl}/v2/product/collections?categoryId=H8SZ4VfsFXa4C9cUeonB&identifier=${id ? id :"aZRFftKgh2F1UedB02Uv"}`,
      {
        headers: {
          "x-api-key":
            "454ccaf106998a71760f6729e7f9edaf1df17055b297b3008ff8b65a5efd7c10",
        },
      }
    );
    setCategoryList(res?.data?.data);
    console.log(res, "sjsjshyyy");
  };
  

  useEffect(() => {
    getData();
    getCategoryListData();
  }, []);

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.heading}>NEW AND POPULAR</h2>

      <div className={styles.filters}>
        {filter?.map((cat) => (
          <button
            key={cat.id}
            className={`${styles.filterBtn} ${
              selectedCategory === cat.id ? styles.active : ""
            }`}
            onClick={() => {getCategoryListData(cat.id)
              setSelectedCategory(cat?.id)
            }}
          >
            {cat?.name}
          </button>
        ))}
      </div>

      <div className={styles.cardGrid}>
        {categoryList?.length > 0 ? (
          categoryList?.map((item) => (
            <ProductCard key={item.id} item={item} />
          ))
        ) : (
          <p className={styles.noProducts}>No products found.</p>
        )}
      </div>
    </div>
  );
};

export default ProductSection;
