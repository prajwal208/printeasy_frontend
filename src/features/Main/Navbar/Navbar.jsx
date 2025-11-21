"use client";

import React, { useState, useEffect } from "react";
import styles from "./navbar.module.scss";
import {
  User,
  Briefcase,
  MapPin,
  Heart,
  ShoppingCart,
  Menu,
  X,
} from "lucide-react";
import Image from "next/image";
import logo from "@/assessts/light-2x.webp";
import DynamicModal from "@/component/Modal/Modal";
import LoginForm from "@/features/signup/LogIn/LoginForm";
import Logout from "@/features/signup/Logout/Logout";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

const Navbar = () => {
  const [isLoginModalVisible, setIsLoginModalVisible] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  // 🔹 Check if user is logged in
  useEffect(() => {
    const token = Cookies.get("idToken");
    setIsLoggedIn(!!token);
  }, []);

  const navItems = [
    { icon: Briefcase, label: "Orders", link: "/orders" },
    { icon: MapPin, label: "Address", link: "/address" },
    { icon: Heart, label: "Wishlist", link: "/wishlist" },
    { icon: ShoppingCart, label: "Cart", link: "/cart" },
  ];

  const handleIconClick = (label, link) => {
    setMenuOpen(false); // 🔥 close menu on every item click

    if (label === "Profile") {
      setIsLoginModalVisible(true);
      return;
    }

    if (!isLoggedIn) {
      setIsLoginModalVisible(true);
    } else {
      router.push(link);
    }
  };

  const handleContinue = () => {
    // After successful login
    setIsLoginModalVisible(false);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    // 👇 Clear all storage and cookies
    Cookies.remove("idToken");
    localStorage.clear();
    sessionStorage.clear();

    setIsLoggedIn(false);
    setIsLoginModalVisible(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(`.${styles.nav}`)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => document.removeEventListener("click", handleClickOutside);
  }, [menuOpen]);

  return (
    <>
      <nav className={styles.nav}>
        {/* Logo */}
        <header className={styles.logoWrapper} onClick={() => router.push("/")}>
          <Image src={logo} alt="logo" className={styles.logo} />
        </header>

        {/* Hamburger Icon */}
        <div
          className={styles.hamburger}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={28} /> : <Menu size={28} />}
        </div>

        {/* Menu */}
        <ul className={`${styles.iconList} ${menuOpen ? styles.active : ""}`}>
          {/* Profile icon — opens login/logout modal */}
          <li
            className={styles.iconItem}
            onClick={() => handleIconClick("Profile")}
          >
            <User size={20} />
            <span>Profile</span>
          </li>

          {/* Other nav items */}
          {navItems.map(({ icon: Icon, label, link }, index) => (
            <li
              key={index}
              onClick={() => handleIconClick(label, link)}
              className={styles.iconItem}
            >
              <Icon size={20} />
              <span>{label}</span>
            </li>
          ))}
        </ul>
      </nav>

      {/* Modal for login/logout */}
      <DynamicModal
        open={isLoginModalVisible}
        onClose={() => setIsLoginModalVisible(false)}
      >
        {isLoggedIn ? (
          <Logout
            onLogout={handleLogout}
            onCancel={() => setIsLoginModalVisible(false)}
            setIsLoggedIn={setIsLoggedIn}
          />
        ) : (
          <LoginForm
            onContinue={handleContinue}
            setIsLoginModalVisible={setIsLoginModalVisible}
            setIsLoggedIn={setIsLoggedIn}
          />
        )}
      </DynamicModal>
    </>
  );
};

export default Navbar;
