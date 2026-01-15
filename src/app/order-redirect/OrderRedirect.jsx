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
  const maxAttempts = 15;

  useEffect(() => {
    const backendOrderId = localStorage.getItem("pendingOrderId");

    if (!backendOrderId) {
      toast.error("Order information not found");
      setStatus("error");
      setLoading(false);
      return;
    }

    pollOrderStatus(backendOrderId);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const pollOrderStatus = (orderId) => {
    attemptsRef.current = 0;
    checkOrderStatus(orderId);

    pollingRef.current = setInterval(() => {
      attemptsRef.current += 1;

      if (attemptsRef.current >= maxAttempts) {
        clearInterval(pollingRef.current);
        setStatus("timeout");
        setLoading(false);
        return;
      }

      checkOrderStatus(orderId);
    }, 1000);
  };

  const checkOrderStatus = async (orderId) => {
    try {
      const response = await api.get(
        `/v1/payment/order-status?orderId=${orderId}`,
        {
          headers: {
            "x-api-key":
              "454ccaf106998a71760f6729e7f9edaf1df17055b297b3008ff8b65a5efd7c10",
          },
        }
      );

      if (!response.data?.success) return;

      const orderStatus = response.data.data.status;
      console.log(orderStatus,"sssssssssss")
      if (orderStatus === "confirmed") {
        clearInterval(pollingRef.current);
        setStatus("success");
        // toast.success("Payment successful!");
        localStorage.setItem("orderId",response?.data?.data?.orderId)
        localStorage.removeItem("pendingOrderId");
        localStorage.removeItem("pendingCashfreeOrderId");
        localStorage.removeItem("pendingOrderAmount");

        await db.cart.clear();
        setLoading(false);
      }

      if (orderStatus === "failed" || orderStatus === "cancelled") {
        clearInterval(pollingRef.current);
        setStatus("failed");
        toast.error("Payment failed or cancelled");

        localStorage.removeItem("pendingOrderId");
        localStorage.removeItem("pendingCashfreeOrderId");
        localStorage.removeItem("pendingOrderAmount");

        setLoading(false);
      }
    } catch (error) {
      console.error("Order status check failed", error);
    }
  };

  return (
    <div className={styles.container}>
      <ToastContainer />
      <div className={styles.card}>

        {/* PROCESSING */}
        {loading && status === "processing" && (
          <div className={styles.content}>
            <div className={styles.spinner} />
            <h2>Processing Payment</h2>
            <p>Please wait while we confirm your payment</p>
          </div>
        )}

        {/* SUCCESS */}
        {status === "success" && (
          <div className={styles.successContent}>
            <div className={styles.successIcon}>✓</div>
            <h2>Payment Successful!</h2>

            <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginTop: "20px" }}>
              <button
                onClick={() => router.push("/orders")}
                style={primaryBtn}
              >
                View Orders
              </button>

              <button
                onClick={() => router.push("/")}
                style={secondaryBtn}
              >
                Continue Shopping
              </button>
            </div>
          </div>
        )}

        {/* FAILED */}
        {status === "failed" && (
          <div className={styles.failedContent}>
            <div className={styles.failedIcon}>✕</div>
            <h2>Payment Failed</h2>

            <div style={{ marginTop: "20px" }}>
              <button
                onClick={() => router.push("/")}
                style={primaryBtn}
              >
                Continue Shopping
              </button>
            </div>
          </div>
        )}

        {/* TIMEOUT */}
        {status === "timeout" && (
          <div className={styles.errorContent}>
            <div className={styles.errorIcon}>⏱</div>
            <h2>Verification In Progress</h2>
            <p>Please check your orders later.</p>

            <button
              onClick={() => router.push("/orders")}
              style={{ ...primaryBtn, marginTop: "16px" }}
            >
              Go to Orders
            </button>
          </div>
        )}

        {/* ERROR */}
        {status === "error" && (
          <div className={styles.errorContent}>
            <div className={styles.errorIcon}>!</div>
            <h2>Something went wrong</h2>

            <button
              onClick={() => router.push("/")}
              style={{ ...primaryBtn, marginTop: "16px" }}
            >
              Continue Shopping
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

/* Button Styles */
const primaryBtn = {
  padding: "12px",
  backgroundColor: "#ff6b00",
  color: "white",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
  fontSize: "16px",
  fontWeight: "bold",
};

const secondaryBtn = {
  padding: "12px",
  backgroundColor: "#95a5a6",
  color: "white",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
  fontSize: "16px",
};
