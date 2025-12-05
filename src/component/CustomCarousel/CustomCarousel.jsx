"use client";

import React, { useEffect, useState } from "react";
import Slider from "react-slick";
import Image from "next/image";
import axios from "axios";
import styles from "./carousel.module.scss";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import {
  User,
  Briefcase,
  MapPin,
  Heart,
  ShoppingCart,
  X,
  Menu,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import DynamicModal from "@/component/Modal/Modal";
import LoginForm from "@/features/signup/LogIn/LoginForm";
import Logout from "@/features/signup/Logout/Logout";

const CACHE_KEY = "carouselBanners";

const CustomCarousel = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const [banners, setBanners] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoginModalVisible, setIsLoginModalVisible] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  const navItems = [
    { icon: Briefcase, label: "Orders", link: "/orders" },
    { icon: MapPin, label: "Address", link: "/address" },
    { icon: Heart, label: "Wishlist", link: "/wishlist" },
  ];

  // Handle clicks outside menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        !event.target.closest(`.${styles.mobileMenu}`) &&
        !event.target.closest(`.${styles.iconButton}`)
      ) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [menuOpen]);

  useEffect(() => {
    setMounted(true);

    const cachedBanners = localStorage.getItem(CACHE_KEY);
    if (cachedBanners) {
      setBanners(JSON.parse(cachedBanners));
      setLoading(false);
    }

    const getImage = async () => {
      try {
        const res = await axios.get(`${apiUrl}/v1/categories/banners`, {
          headers: {
            "x-api-key":
              "454ccaf106998a71760f6729e7f9edaf1df17055b297b3008ff8b65a5efd7c10",
          },
        });
        const all = res?.data?.data?.flatMap((b) => b?.banners || []);
        setBanners(all);
        localStorage.setItem(CACHE_KEY, JSON.stringify(all));
      } catch (err) {
        console.error("Error fetching banner images:", err);
      } finally {
        setLoading(false);
      }
    };

    if (!cachedBanners) getImage();

    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [apiUrl]);

  useEffect(() => {
    const token = Cookies.get("idToken");
    setIsLoggedIn(!!token);
  }, []);

  const handleIconClick = (label, link) => {
    setMenuOpen(false);

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
    setIsLoginModalVisible(false);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    document.cookie.split(";").forEach((cookie) => {
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    });

    localStorage.clear();
    sessionStorage.clear();

    setIsLoggedIn(false);
    setIsLoginModalVisible(false);
  };

  if (!mounted) return null;

  const desktopSettings = {
    dots: false,
    infinite: true,
    speed: 7000,
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 0,
    cssEase: "linear",
    pauseOnHover: false,
    arrows: false,
  };

  const mobileSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    arrows: false,
  };

  return (
    <main className={styles.carousel_main_wrap}>
      <Slider {...(isMobile ? mobileSettings : desktopSettings)}>
        {banners.map((item, i) => (
          <div key={i} className={styles.banner_item}>
            <div className={styles.imageWrapper}>
              <Image
                src={item.imageUrl}
                alt={`banner-${i}`}
                width={800}
                height={600}
                className={`${styles.banner_image} ${
                  isMobile ? styles.mobileBanner : ""
                }`}
                priority
              />

              {isMobile && (
                <div className={styles.mobileOverlay}>
                  <div className={styles.mobileHeader}>
                    <button
                      className={styles.iconButton}
                      aria-label="Menu"
                      onClick={() => setMenuOpen(!menuOpen)}
                    >
                      {menuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>

                    <div className={styles.searchWrapper}>
                      <svg
                        className={styles.searchIcon}
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          cx="11"
                          cy="11"
                          r="8"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                        <path
                          d="M21 21l-4.35-4.35"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                      <input
                        type="text"
                        placeholder="Search"
                        className={styles.searchInput}
                        onClick={() => router.push("/search")}
                      />
                    </div>

                    <button
                      className={styles.iconButton}
                      aria-label="Shopping bag"
                      onClick={() => router.push("/cart")}
                    >
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <line
                          x1="3"
                          y1="6"
                          x2="21"
                          y2="6"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                        <path
                          d="M16 10a4 4 0 01-8 0"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>

                  {menuOpen && (
                    <ul className={styles.mobileMenu}>
                      <li onClick={() => handleIconClick("Profile")}>
                        <User size={20} /> Profile
                      </li>
                      {navItems.map(({ icon: Icon, label, link }, idx) => (
                        <li
                          key={idx}
                          onClick={() => handleIconClick(label, link)}
                        >
                          <Icon size={20} /> {label}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </Slider>

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
    </main>
  );
};

export default CustomCarousel;
