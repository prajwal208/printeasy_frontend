"use client";

import React, { useEffect, useState } from "react";
import api from "@/axiosInstance/axiosInstance";
import styles from "./info.module.scss";
import { Loader2 } from "lucide-react";

const InfoPageClient = ({ slug }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const getData = async () => {
      try {
        const res = await api.get(`${apiUrl}/v1/policies/${slug}`, {
          headers: {
            "x-api-key":
              "454ccaf106998a71760f6729e7f9edaf1df17055b297b3008ff8b65a5efd7c10",
          },
        });
        setData(res.data?.data);
      } catch (err) {
        console.error("Error fetching policy data:", err);
      } finally {
        setLoading(false);
      }
    };

    if (slug) getData();
  }, [slug]);

  if (loading)
    return (
      <div className={styles.loader}>
        <Loader2 className="animate-spin" size={28} />
        <p>Loading {slug.replace("-", " ")}...</p>
      </div>
    );

  if (!data)
    return <p className={styles.error}>No data found for this policy.</p>;

  return (
    <div className={styles.infoPage}>
      <div className={styles.header}>
        <h1>{data?.title || slug.replace("-", " ").toUpperCase()}</h1>
      </div>

      <div
        className={styles.content}
        dangerouslySetInnerHTML={{ __html: data?.content }}
      />
    </div>
  );
};

export default InfoPageClient;
