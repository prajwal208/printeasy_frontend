"use client";
import React from "react";
import styles from "./header.module.scss";
import { ChevronLeft, Search } from "lucide-react";
import { useRouter } from "next/navigation";

const Header = () => {
    const router = useRouter()
    const name = localStorage.getItem("name")
  return (
    <div className={styles.sdks}>
      <button className={styles.iconBtn} onClick={() => router.push('/')}> 
        <ChevronLeft size={22} />
      </button>

      <h2 className={styles.title}>{name}</h2>

      <button className={styles.iconBtn}>
        <Search size={22} />
      </button>
    </div>
  );
};

export default Header;
