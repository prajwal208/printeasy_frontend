"use client";

import React from "react";
import styles from "./footer.module.scss";
import { Facebook, Instagram, Youtube } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import logo from "../../assessts/logoFotter.svg"

const Footer = () => {
  const router = useRouter();

  const handleNavigate = (slug) => {
    router.push(`/info/${slug}`);
  };

  return (
    <footer className={styles.footer}>
      {/* Logo */}
      <div className={styles.logoSection}>
        <Image src={logo} alt="Onrise" width={35} height={35} />
        <h2>ONRISE</h2>
        <p>By Print Easy</p>
      </div>

      {/* Description */}
      <p className={styles.description}>
        Onrise: Your partner in premium custom apparel & merchandise.
      </p>

      <ul className={styles.services}>
        <li>• Bulk Custom Printing (DTF & UV)</li>
        <li>• On-Demand Brand Merchandise</li>
        <li>• Tech-Enabled Fashion Solutions</li>
      </ul>

      <div className={styles.divider} />

      {/* Policies */}
      <div className={styles.policies}>
        <h3>POLICIES</h3>
        <ul>
          <li onClick={() => handleNavigate("privacy-policy")}>
            Privacy Policy
          </li>
          <li onClick={() => handleNavigate("return-and-exchange")}>
            Return & Exchange
          </li>
          <li onClick={() => handleNavigate("shipping-policy")}>
            Shipping Policy
          </li>
          <li onClick={() => handleNavigate("terms-and-conditions")}>
            Terms & Conditions
          </li>
        </ul>
      </div>

      <div className={styles.divider} />

      {/* Support */}
      <p className={styles.support}>
        Customer care support : <span>+91 90199 09704</span>
      </p>

      {/* Social Icons */}
      <div className={styles.socialIcons}>
        <a href="https://www.instagram.com/onrise.official" aria-label="Instagram">
          <Instagram />
        </a>
        <a href="https://www.facebook.com/profile.php?id=61573523216267" aria-label="Facebook">
          <Facebook />
        </a>
        <a href="https://www.youtube.com/@Onrise-o6x" aria-label="YouTube">
          <Youtube />
        </a>
      </div>

      {/* Copyright */}
      <p className={styles.copyRight}>
        Copyright © 2026 Onrise all rights reserved a Printeasy Company
      </p>
    </footer>
  );
};

export default Footer;
