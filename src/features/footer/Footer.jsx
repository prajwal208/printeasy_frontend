"use client";

import React, { useRef, useState } from "react";
import styles from "./footer.module.scss";
import { Facebook, Instagram, Youtube } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import logo from "../../assessts/logoFotter.svg";

const SUPPORT_PHONE = "919019909704";
const SUPPORT_DISPLAY = "+91 90199 09704";

const POLICIES = [
  { slug: "privacy-policy", label: "Privacy Policy", icon: "🔒" },
  { slug: "return-and-exchange", label: "Return & Exchange", icon: "↩️" },
  { slug: "shipping-policy", label: "Shipping Policy", icon: "🚚" },
  { slug: "terms-and-conditions", label: "Terms & Conditions", icon: "📄" },
];

const Footer = () => {
  const router = useRouter();
  const [waNumber, setWaNumber] = useState("");
  const [toastMsg, setToastMsg] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimerRef = useRef(null);

  const handleNavigate = (slug) => {
    router.push(`/info/${slug}`);
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setToastVisible(true);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToastVisible(false);
    }, 3000);
  };

  const submitWA = () => {
    const num = waNumber.trim().replace(/\D/g, "");
    if (num.length < 10) {
      showToast("Enter a valid 10-digit number");
      return;
    }
    setWaNumber("");
    showToast("Subscribed! Offers coming on WhatsApp 🎉");
  };

  const supportHref = `https://wa.me/${SUPPORT_PHONE}?text=${encodeURIComponent(
    "Hi, I need help with my Onrise order"
  )}`;

  return (
    <footer className={styles.footer}>
      <div className={styles.hero}>
        <div className={styles.logoBlock}>
          <div className={styles.logoRing}>
            <Image src={logo} alt="" width={30} height={30} />
          </div>
          <div className={styles.logoName}>ONRISE</div>
          <div className={styles.logoBy}>
            by <span className={styles.logoByDot} aria-hidden /> <span>PrintEasy</span>
          </div>
        </div>

        <p className={styles.tagline}>
          Premium custom apparel for kids.
          <br />
          <strong>Personalised with love,</strong> shipped in 4 days.
        </p>

        <div className={styles.waOptin}>
          <div className={styles.waOptinTitle}>📲 Get offers on WhatsApp</div>
          <div className={styles.waOptinSub}>
            Order updates · exclusive deals · new drops
          </div>
          <div className={styles.waInputRow}>
            <input
              className={styles.waInput}
              type="tel"
              placeholder="Your WhatsApp number"
              maxLength={10}
              value={waNumber}
              onChange={(e) =>
                setWaNumber(e.target.value.replace(/\D/g, "").slice(0, 10))
              }
              aria-label="WhatsApp number"
            />
            <button
              type="button"
              className={styles.waSubmit}
              onClick={submitWA}
              aria-label="Subscribe on WhatsApp"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff" aria-hidden>
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.549 4.107 1.51 5.843L.057 23.428a.5.5 0 0 0 .609.61l5.7-1.476A11.952 11.952 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.006-1.374l-.36-.213-3.722.964.992-3.617-.233-.373A9.818 9.818 0 1 1 12 21.818z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className={styles.divider} />

      <div className={styles.stats}>
        <div className={styles.stat}>
          <div className={styles.statN}>
            3K<span>+</span>
          </div>
          <div className={styles.statL}>Parents</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statN}>
            4.9<span>★</span>
          </div>
          <div className={styles.statL}>Rating</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statN}>
            4<span>D</span>
          </div>
          <div className={styles.statL}>Ships</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statN}>
            8<span>D</span>
          </div>
          <div className={styles.statL}>Returns</div>
        </div>
      </div>

      <div className={styles.divider} />

      <div className={styles.sectionWrap}>
        <div className={styles.secLbl}>Accepted Payments</div>
        <div className={styles.payIcons}>
          <div className={styles.payChip}>
            <span className={styles.payChipIcon}>⚡</span>
            <span className={styles.payChipTxt}>UPI</span>
          </div>
          <div className={styles.payChip}>
            <span className={styles.payChipIcon}>💳</span>
            <span className={styles.payChipTxt}>Cards</span>
          </div>
          <div className={styles.payChip}>
            <span className={styles.payChipTxt}>Cashfree</span>
          </div>
          <div className={styles.payChip}>
            <span className={styles.payChipTxt}>Net Banking</span>
          </div>
          <div className={styles.payChip}>
            <span className={styles.payChipIcon}>🚚</span>
            <span className={styles.payChipTxt}>COD</span>
          </div>
        </div>
      </div>

      <div className={styles.policyWrap}>
        <div className={styles.secLbl}>Policies</div>
        <div className={styles.policyGrid}>
          {POLICIES.map((p) => (
            <button
              key={p.slug}
              type="button"
              className={styles.policyLink}
              onClick={() => handleNavigate(p.slug)}
            >
              <span className={styles.policyLinkLeft}>
                <span className={styles.policyLinkIcon}>{p.icon}</span>
                <span className={styles.policyLinkTxt}>{p.label}</span>
              </span>
              <span className={styles.policyLinkArrow}>›</span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.supportWrap}>
        <div className={styles.secLbl}>Customer Support</div>
        <a
          className={styles.supportCard}
          href={supportHref}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className={styles.supIcon} aria-hidden>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.549 4.107 1.51 5.843L.057 23.428a.5.5 0 0 0 .609.61l5.7-1.476A11.952 11.952 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.006-1.374l-.36-.213-3.722.964.992-3.617-.233-.373A9.818 9.818 0 1 1 12 21.818z" />
            </svg>
          </span>
          <span className={styles.supInfo}>
            <span className={styles.supName}>Customer care support</span>
            <span className={styles.supNum}>{SUPPORT_DISPLAY}</span>
          </span>
          <span className={styles.supBadge}>Chat Now →</span>
        </a>
      </div>

      <div className={styles.socialsWrap}>
        <a
          className={styles.soc}
          href="https://www.instagram.com/onrise.official"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Instagram"
        >
          <Instagram size={16} strokeWidth={1.8} />
          <span className={styles.socLbl}>Instagram</span>
        </a>
        <a
          className={styles.soc}
          href="https://www.facebook.com/profile.php?id=61573523216267"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Facebook"
        >
          <Facebook size={16} strokeWidth={1.8} />
          <span className={styles.socLbl}>Facebook</span>
        </a>
        <a
          className={styles.soc}
          href="https://www.youtube.com/@Onrise-o6x"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="YouTube"
        >
          <Youtube size={16} strokeWidth={1.8} />
          <span className={styles.socLbl}>YouTube</span>
        </a>
      </div>

      <div className={styles.brandStrip}>
        <span className={styles.brandStripLock}>🔒</span>
        <p className={styles.brandStripTxt}>
          Onrise is a <span className={styles.pe}>PrintEasy</span> brand ·{" "}
          <strong>Trusted by 3,000+ families</strong> · Safe & secure
        </p>
      </div>

      <div className={styles.copyright}>
        <div className={styles.copyDiv} />
        <div className={styles.copyLogo}>ONRISE</div>
        <p className={styles.copyTxt}>
          © 2026 Onrise · All rights reserved
          <br />
          A PrintEasy Company · onrise.in
        </p>
      </div>

      <div
        className={`${styles.toast} ${toastVisible ? styles.toastShow : ""}`}
        role="status"
        aria-live="polite"
      >
        ✓ <span>{toastMsg}</span>
      </div>
    </footer>
  );
};

export default Footer;
