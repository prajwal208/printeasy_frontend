"use client";

import React from "react";
import styles from "./footer.module.scss";
import { Facebook, Instagram, Youtube, Phone, Mail, Globe } from "lucide-react";
import { useRouter } from "next/navigation";

const Footer = () => {
  const router = useRouter();

  // Handle dynamic navigation
  const handleNavigate = (slug) => {
    router.push(`/info/${slug}`); // dynamic route example -> /info/about-us
  };

  return (
    <footer className={styles.footer}>
      <div className={styles.socialIcons}>
        <a href="#" aria-label="Facebook">
          <Facebook />
        </a>
        <a href="#" aria-label="Pinterest">
          <Instagram />
        </a>
        <a href="#" aria-label="YouTube">
          <Youtube />
        </a>
      </div>

      <div className={styles.footerContent}>
        {/* Contact Section */}
        <div className={styles.contactSection}>
          <h3>Contact Us</h3>
          <div className={styles.contactItem}>
            <Globe size={18} />
            <p>
              No.1 ,Vinayaka Layout, KHB Calony, Basaveshwaranagar, Bangalore
              560079
            </p>
          </div>
          <div className={styles.contactItem}>
            <Mail size={18} />
            <p>info@printeasy.co.in</p>
          </div>
          <div className={styles.contactItem}>
            <Phone size={18} />
            <p>+91 90 1990 9704</p>
          </div>
        </div>

        
        <div className={styles.quickLinks}>
          <h3>Quick Links</h3>
          <ul>
            <li onClick={() => handleNavigate("about-us")}>About Us</li>
            <li onClick={() => handleNavigate("terms-and-conditions")}>
              Terms and Conditions
            </li>
            <li onClick={() => handleNavigate("privacy-policy")}>
              Privacy Policy
            </li>
            <li onClick={() => handleNavigate("refund-policy")}>
              Refund Policy
            </li>
             <li onClick={() => handleNavigate("shipping-policy")}>
              Shipping Policy
            </li>
          </ul>
        </div>
      </div>

      <div className={styles.copyRight}>
        © 2025 Printeasy. All rights reserved
      </div>
    </footer>
  );
};

export default Footer;
