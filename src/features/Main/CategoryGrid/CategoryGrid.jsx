"use client";

import React, { useEffect, useState } from "react";
import styles from "./categotyGrid.module.scss";
import CategoryCard from "@/component/CategoryCard/CategoryCard";
import axios from "axios";
import { useRouter } from "next/navigation";

const CategoryGrid = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const getData = async () => {
    try {
      const res = await axios.get(`${apiUrl}/v1/categories/all`, {
        headers: {
          "x-api-key":
            "454ccaf106998a71760f6729e7f9edaf1df17055b297b3008ff8b65a5efd7c10",
        },
      });
      setCategories(res?.data?.data?.[0].collections || []);
    } catch (err) {
      console.error("Error fetching categories:", err);
    } finally {
      setLoading(false); // 🔹 stop loader
    }
  };

  useEffect(() => {
    getData();
  }, []);

  const handleCardClick = (id) => {
    router.push(`/selectedcategory/${id}`);
  };

  // Number of skeleton cards to show
  const skeletonCount = 12;

  return (
    <main className={styles.featured_categories}>
      <h3>FEATURED CATEGORIES</h3>
      <section className={styles.gridWrapper}>
        {loading
          ? Array.from({ length: skeletonCount }).map((_, i) => (
              <div key={i} className={styles.skeletonCard}></div>
            ))
          : categories.map((item) => (
              <div key={item?.id} onClick={() => handleCardClick(item?.id)}>
                <CategoryCard image={item.image} title={item.name} />
              </div>
            ))}
      </section>
    </main>
  );
};

export default CategoryGrid;
