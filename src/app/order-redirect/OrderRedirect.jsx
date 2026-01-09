"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from "@/axiosInstance/axiosInstance";
import { db } from "@/lib/db";
import styles from "./orderRedirect.module.scss";

export default function OrderRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("processing");
  const pollingRef = useRef(null);
  const attemptsRef = useRef(0);
  const maxAttempts = 30; // Max 30 attempts (30 seconds with 1s interval)

  useEffect(() => {
    const handleRedirect = async () => {
      try {
        // Get order_id from URL (Cashfree redirects with order_id)
        const cashfreeOrderId = searchParams.get("order_id");
        const backendOrderId = localStorage.getItem("pendingOrderId");

        console.log("Order redirect page loaded:", {
          cashfreeOrderId,
          backendOrderId,
        });

        if (!cashfreeOrderId && !backendOrderId) {
          console.error("No order IDs found");
          toast.error("Order information not found");
          setStatus("error");
          setLoading(false);
          setTimeout(() => router.push("/cart?error=no_order_data"), 2000);
          return;
        }

        // Start polling backend for order status
        pollOrderStatus(backendOrderId);
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

  const pollOrderStatus = (orderId) => {
    if (!orderId) {
      console.error("No order ID for polling");
      setStatus("error");
      setLoading(false);
      return;
    }

    console.log("Starting to poll order status for:", orderId);
    attemptsRef.current = 0;
    
    // Check immediately first
    checkOrderStatus(orderId);

    // Then poll every second
    pollingRef.current = setInterval(() => {
      attemptsRef.current += 1;
     
      
      if (attemptsRef.current >= maxAttempts) {
        clearInterval(pollingRef.current);
        console.log("Max polling attempts reached");
        setStatus("timeout");
        toast.warning("Payment verification taking longer than expected. Please check your orders.");
        setLoading(false);
        setTimeout(() => router.push("/orders"), 3000);
        return;
      }
      
      checkOrderStatus(orderId);
    }, 1000); // Poll every 1 second
  };

  const checkOrderStatus = async (orderId) => {
    try {
      console.log("Checking order status:", orderId);
      
      const response = await api.get(
        `/v1/payment/order-status?orderId=${orderId}`,
        {
          headers: {
            "x-api-key":
              "454ccaf106998a71760f6729e7f9edaf1df17055b297b3008ff8b65a5efd7c10",
          },
        }
      );

      console.log("Order status response:", response.data);

      if (response.data.success) {
        const orderData = response.data.data;
        const orderStatus = orderData.status;

        console.log("Order status:", orderStatus);

        // Success - Order confirmed
        if (orderStatus === "CONFIRMED") {
          if (pollingRef.current) clearInterval(pollingRef.current);
          setStatus("success");
          toast.success("Payment successful!");
          
          // Clear localStorage
          localStorage.removeItem("pendingOrderId");
          localStorage.removeItem("pendingCashfreeOrderId");
          localStorage.removeItem("pendingOrderAmount");
          
          // Clear cart
          await db.cart.clear();
          
          setLoading(false);
          setTimeout(() => router.push("/order-success"), 1500);
          return;
        }

        // Failed or Cancelled
        if (orderStatus === "CANCELLED" || orderStatus === "FAILED") {
          if (pollingRef.current) clearInterval(pollingRef.current);
          setStatus("failed");
          toast.error("Payment failed or was cancelled");
          
          // Clear localStorage
          localStorage.removeItem("pendingOrderId");
          localStorage.removeItem("pendingCashfreeOrderId");
          localStorage.removeItem("pendingOrderAmount");
          
          setLoading(false);
          setTimeout(() => router.push("/cart?error=payment_failed"), 2000);
          return;
        }

        // Still pending - continue polling
        console.log("Order still pending, continuing to poll...");
      }
    } catch (error) {
      console.error("Status check error:", error);
      // Don't stop polling on network errors
      if (error.response?.status === 404) {
        console.log("Order not found yet, continuing to poll...");
      }
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
            <p className={styles.subtitle}>
              Please wait while we confirm your payment...
            </p>
            <p className={styles.note}>
              This may take a few moments. Do not close this page.
            </p>
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

        {status === "timeout" && (
          <div className={styles.errorContent}>
            <div className={styles.errorIcon}>⏱</div>
            <h2 className={styles.errorTitle}>Verification In Progress</h2>
            <p className={styles.errorSubtitle}>
              Please check your orders page...
            </p>
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