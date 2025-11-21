"use client";

import React, { useState, useEffect, useRef } from "react";
import styles from "./otp.module.scss";

const OTPModal = ({ phoneNumber, otp, setOtp, handleVerifyOtp, loading }) => {
  const [timer, setTimer] = useState(45);
  const inputRefs = useRef([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (e, index) => {
    const value = e.target.value;
    if (/^[0-9]$/.test(value) || value === "") {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      if (value && index < 5) inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleSubmit = () => {
    const otpValue = otp.join("");
    if (otpValue.length === 6) handleVerifyOtp(otpValue);
    else alert("Please enter complete OTP");
  };

  return (
    <div className={styles.otpModal}>
      {loading && (
        <div className={styles.loaderOverlay}>
          <div className={styles.loader}></div>
        </div>
      )}

      <h2>OTP Verification</h2>
      <p>We have sent a verification code to +91 {phoneNumber}</p>

      <div className={styles.otpBoxes}>
        {otp.map((digit, i) => (
          <input
            key={i}
            type="text"
            maxLength="1"
            value={digit}
            ref={(el) => (inputRefs.current[i] = el)}
            onChange={(e) => handleChange(e, i)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            disabled={loading} // prevent typing while verifying
          />
        ))}
      </div>

      <button className={styles.submitBtn} onClick={handleSubmit} disabled={loading}>
        Verify OTP
      </button>

      <p>
        Didn’t get the OTP? Resend in <strong>{timer}s</strong>
      </p>
    </div>
  );
};

export default OTPModal;
