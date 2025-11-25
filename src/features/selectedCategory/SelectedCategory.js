"use client";
import React, { useEffect, useState } from "react";
import styles from "./selectedcategory.module.scss";
import axios from "axios";
import { useParams } from "next/navigation";
import ProductCard from "@/component/ProductCard/ProductCard";
import api from "@/axiosInstance/axiosInstance";
import Header from "@/component/header/Header";

const SelectedCategory = () => {
  const [categoryList, setCategoryList] = useState([]);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const { slug } = useParams();
  
  const getCategoryListData = async () => {
    const res = await api.get(
      `${apiUrl}/v2/product/collections?categoryId=H8SZ4VfsFXa4C9cUeonB&identifier=${slug}`,
      {
        headers: {
          "x-api-key":
            "454ccaf106998a71760f6729e7f9edaf1df17055b297b3008ff8b65a5efd7c10",
        },
      }
    );
    setCategoryList(res?.data?.data);
  };

  useEffect(() => {
    getCategoryListData();
  }, []);

  return (
    <>
      {/* Visible only on mobile */}
      <div className={styles.mobileHeader}>
        <Header />
      </div>

      <div className={styles.cardGrid}>
        {categoryList?.map((item) => (
          <ProductCard key={item.id} item={item} />
        ))}
      </div>
    </>
  );
};

export default SelectedCategory;
