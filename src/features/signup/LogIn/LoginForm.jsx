"use client";

import React, { useState } from "react";
import styles from "./LoginForm.module.scss";
import { auth } from "@/firebase/config";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import OTPModal from "../OTPModal/OTPModal";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

const LoginForm = ({ onContinue, setIsLoginModalVisible }) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(Array(6).fill(""));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false); // 🔹 loading state
  const router = useRouter();

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        { size: "invisible" }
      );
    }
  };

  // Send OTP
  const handleSendOtp = async () => {
    if (!phoneNumber) return alert("Enter phone number");

    setLoading(true); // 🔹 show loader
    setupRecaptcha();
    const appVerifier = window.recaptchaVerifier;

    try {
      const confirmationResult = await signInWithPhoneNumber(
        auth,
        `+91${phoneNumber}`,
        appVerifier
      );
      window.confirmationResult = confirmationResult;
      setOtpSent(true);
      setError("");
    } catch (err) {
      console.error("Error sending OTP:", err);
      setError(err.message);
    } finally {
      setLoading(false); // 🔹 hide loader after sending OTP
    }
  };

  // Verify OTP
  const handleVerifyOtp = async (otpValue) => {
    if (!otpValue) return alert("Enter OTP");

    setLoading(true); // 🔹 show loader during verification
    try {
      const result = await window.confirmationResult.confirm(otpValue);
      const user = result.user;

      const idToken = await user.getIdToken();
      const refreshToken = user.refreshToken;

      Cookies.set("idToken", idToken);
      Cookies.set("refreshToken", refreshToken);
      Cookies.set("phoneNumber", user.phoneNumber);

      onContinue?.();
    } catch (err) {
      console.error("OTP verification failed:", err);
      setError("Invalid OTP. Please try again.");
    } finally {
      setLoading(false); // 🔹 hide loader
    }
  };

  const handleNavigate = (slug) => {
    router.push(`/info/${slug}`);
    setIsLoginModalVisible(false);
  };

  return (
    <div className={styles.loginForm}>
      {loading && (
        <div className={styles.loaderOverlay}>
          <div className={styles.loader}></div>
        </div>
      )}

      {!otpSent ? (
        <>
          <h2 className={styles.title}>
            Glad to have you at Print Easy. Stay tuned for exclusive offers & updates!
          </h2>
          
          <div className={styles.divider}>
            <span className={styles.dividerText}>Login or Signup</span>
          </div>

          <p className={styles.subtitle}>
            Use your email or another service to continue, signing up is free!
          </p>

          <input
            type="text"
            placeholder="Enter Mobile Number"
            className={styles.input}
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />

          <div id="recaptcha-container"></div>

          <button className={styles.continueBtn} onClick={handleSendOtp}>
            Continue
          </button>

          <p className={styles.terms}>
            By signing in you agree to our{" "}
            <span onClick={() => handleNavigate("terms-and-conditions")}>Terms of Service</span> and{" "}
            <span onClick={() => handleNavigate("privacy-policy")}>Privacy Policy</span>
          </p>
        </>
      ) : (
        <OTPModal
          phoneNumber={phoneNumber}
          otp={otp}
          setOtp={setOtp}
          handleVerifyOtp={handleVerifyOtp}
          loading={loading} // 🔹 pass loader state
        />
      )}

      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
};

export default LoginForm;
