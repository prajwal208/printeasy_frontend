"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from "@/axiosInstance/axiosInstance";
import { db } from "@/lib/db";
import styles from "./orderRedirect.module.scss"

export default function OrderRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("processing");
  const pollingRef = useRef(null);
  const attemptsRef = useRef(0);
  const maxAttempts = 15; // Max 15 attempts (15 seconds with 1s interval)

  useEffect(() => {
    const handleRedirect = async () => {
      try {
        const sessionKey = searchParams.get("sessionKey");
        const orderId = localStorage.getItem("pendingOrderId");

        if (!sessionKey) {
          toast.error("Invalid redirect session");
          setStatus("error");
          setLoading(false);
          setTimeout(() => router.push("/cart?error=invalid_session"), 2000);
          return;
        }

        if (!orderId) {
          toast.error("Order information not found");
          setStatus("error");
          setLoading(false);
          setTimeout(() => router.push("/cart?error=no_order_data"), 2000);
          return;
        }

        pollPaymentStatus(sessionKey, orderId);
      } catch (error) {
        console.error("Redirect error:", error);
        toast.error("An error occurred");
        setStatus("error");
        setLoading(false);
        setTimeout(() => router.push("/cart?error=processing_error"), 2000);
      }
    };

    handleRedirect();

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [searchParams, router]);

  const pollPaymentStatus = (sessionKey, orderId) => {
    attemptsRef.current = 0;
    checkPaymentStatus(sessionKey, orderId);

    pollingRef.current = setInterval(() => {
      attemptsRef.current += 1;
      if (attemptsRef.current >= maxAttempts) {
        clearInterval(pollingRef.current);
        setLoading(false);
        return;
      }
      checkPaymentStatus(sessionKey, orderId);
    }, 1000);
  };

  const checkPaymentStatus = async (sessionKey, orderId) => {
    try {
      const response = await api.get(
        `/v1/payment/redirect-status?sessionKey=${sessionKey}&orderId=${orderId}`,
        {
          headers: {
            "x-api-key":
              "454ccaf106998a71760f6729e7f9edaf1df17055b297b3008ff8b65a5efd7c10",
          },
        }
      );

      if (response.data.success) {
        const paymentData = response.data.data;

        if (
          paymentData.txStatus === "SUCCESS" ||
          paymentData.txStatus === "PAID"
        ) {
          if (pollingRef.current) clearInterval(pollingRef.current);
          setStatus("success");
          toast.success("Payment successful!");
          localStorage.removeItem("pendingOrderId");
          localStorage.removeItem("pendingCashfreeOrderId");
          localStorage.removeItem("pendingOrderAmount");
          await db.cart.clear();
          setLoading(false);
          setTimeout(() => router.push("/order-success"), 1500);
        } else if (
          paymentData.txStatus === "FAILED" ||
          paymentData.txStatus === "CANCELLED" ||
          paymentData.txStatus === "USER_DROPPED"
        ) {
          if (pollingRef.current) clearInterval(pollingRef.current);
          const errorMessage =
            paymentData.txStatus === "CANCELLED"
              ? "Payment cancelled"
              : "Payment failed";
          setStatus("failed");
          toast.error(errorMessage);
          localStorage.removeItem("pendingOrderId");
          localStorage.removeItem("pendingCashfreeOrderId");
          localStorage.removeItem("pendingOrderAmount");
          setLoading(false);
          setTimeout(() => router.push("/cart?error=payment_failed"), 2000);
        }
      }
    } catch (error) {
      console.error("Status check error:", error);
    }
  };

  return (
    <div className={styles.container}>
      <ToastContainer />
      <div className={styles.card}>
        {loading && status === "processing" && (
          <div className={styles.content}>
            <div className={styles.spinner}></div>
            <h2 className={styles.title}>Processing Payment</h2>
            <p className={styles.subtitle}>Please wait...</p>
          </div>
        )}

        {status === "success" && (
          <div className={styles.successContent}>
            <div className={styles.successIcon}>✓</div>
            <h2 className={styles.successTitle}>Payment Successful!</h2>
            <p className={styles.successSubtitle}>Redirecting...</p>
          </div>
        )}

        {status === "failed" && (
          <div className={styles.failedContent}>
            <div className={styles.failedIcon}>✕</div>
            <h2 className={styles.failedTitle}>Payment Failed</h2>
            <p className={styles.failedSubtitle}>Returning to cart...</p>
          </div>
        )}

        {status === "error" && (
          <div className={styles.errorContent}>
            <div className={styles.errorIcon}>!</div>
            <h2 className={styles.errorTitle}>Error</h2>
            <p className={styles.errorSubtitle}>Returning to cart...</p>
          </div>
        )}
      </div>
    </div>
  );
}
