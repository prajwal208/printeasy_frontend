"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/db";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from "@/axiosInstance/axiosInstance";

export default function OrderSuccess() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);
  const pollingIntervalRef = useRef(null);
  const maxPollingTime = 5 * 60 * 1000; // 5 minutes
  const pollingStartTime = useRef(Date.now());

  useEffect(() => {
    const verifyPayment = async () => {
      // Get stored order data from localStorage
      const orderId = localStorage.getItem("pendingOrderId");
      const cashfreeOrderId = localStorage.getItem("pendingCashfreeOrderId");
      const orderAmount = localStorage.getItem("pendingOrderAmount");

      console.log("Order data from localStorage:", {
        orderId,
        cashfreeOrderId,
        orderAmount,
      });

      if (!orderId || !cashfreeOrderId) {
        console.error("Missing order data in localStorage");
        toast.error("Order data not found. Please check your orders.");
        setError(true);
        setLoading(false);
        return;
      }

      // Start polling for payment status
      startPaymentPolling(orderId, cashfreeOrderId, orderAmount);
    };

    verifyPayment();

    // Cleanup polling on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  const startPaymentPolling = (orderId, cashfreeOrderId, orderAmount) => {
    pollingStartTime.current = Date.now();

    // Check payment status immediately
    checkPaymentStatus(orderId, cashfreeOrderId);

    // Then poll every 3 seconds
    pollingIntervalRef.current = setInterval(() => {
      // Check if we've exceeded max polling time
      if (Date.now() - pollingStartTime.current > maxPollingTime) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
        setLoading(false);
        setError(true);
        toast.error("Payment verification timeout. Please check your order status.");
        return;
      }

      checkPaymentStatus(orderId, cashfreeOrderId);
    }, 3000);
  };

  const checkPaymentStatus = async (orderId, cashfreeOrderId) => {
    try {
      console.log("Checking payment status:", { orderId, cashfreeOrderId });

      const res = await api.post(
        "/v1/payment/status", // Note: singular "payment" not "payments"
        {
          cashfreeOrderId: cashfreeOrderId,
          orderId: orderId,
        },
        {
          headers: {
            "x-api-key":
              "454ccaf106998a71760f6729e7f9edaf1df17055b297b3008ff8b65a5efd7c10",
          },
        }
      );

      console.log("Payment status response:", res.data);

      if (res.data.success) {
        // Check if order was already confirmed (backend processed it)
        if (
          res.data.message?.includes("already confirmed") ||
          res.data.message?.includes("Order placed successfully")
        ) {
          // Payment successful and order processed
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }

          // Clear stored data
          localStorage.removeItem("pendingOrderId");
          localStorage.removeItem("pendingCashfreeOrderId");
          localStorage.removeItem("pendingOrderAmount");

          // Clear cart
          await db.cart.clear();

          toast.success("Order Confirmed 🎉");
          setSuccess(true);
          setLoading(false);

          // Clean up URL
          window.history.replaceState({}, "", "/order-success");
          return;
        }

        const { isSuccess, paymentStatus } = res.data.data || {};

        if (isSuccess) {
          // Payment successful - backend will process automatically
          // Wait a moment for backend to process, then check again
          setTimeout(() => {
            checkPaymentStatus(orderId, cashfreeOrderId);
          }, 2000);
        } else if (
          paymentStatus === "FAILED" ||
          paymentStatus === "CANCELLED" ||
          paymentStatus === "USER_DROPPED"
        ) {
          // Payment failed or cancelled - stop polling
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }

          const errorMessage =
            paymentStatus === "CANCELLED"
              ? "Payment was cancelled"
              : paymentStatus === "USER_DROPPED"
              ? "Payment was cancelled by user"
              : "Payment failed";

          toast.error(errorMessage);
          setError(true);
          setLoading(false);

          // Clear stored data
          localStorage.removeItem("pendingOrderId");
          localStorage.removeItem("pendingCashfreeOrderId");
          localStorage.removeItem("pendingOrderAmount");

          // Clean up URL
          window.history.replaceState({}, "", "/order-success");
        }
        // If payment is still pending, continue polling (no action needed)
      }
    } catch (error) {
      console.error("Payment status check error:", error);
      console.error("Error response:", error.response?.data);

      // Don't stop polling on temporary errors
      // Only stop if it's a clear failure
      if (
        error.response?.status === 404 ||
        error.response?.data?.message?.includes("not found")
      ) {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        setError(true);
        setLoading(false);
        toast.error("Order not found. Please contact support.");
      } else if (error.response?.status === 400) {
        // 400 error - might be missing parameters
        console.error("400 Error - Missing parameters:", error.response?.data);
        toast.error(
          error.response?.data?.message || "Invalid request. Please try again."
        );
        // Continue polling - might be a temporary issue
      }
      // For other errors, continue polling (might be temporary network issue)
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          padding: "20px",
        }}
      >
        <ToastContainer />
        <div
          style={{
            border: "4px solid #f3f3f3",
            borderTop: "4px solid #ff6b00",
            borderRadius: "50%",
            width: "50px",
            height: "50px",
            animation: "spin 1s linear infinite",
            marginBottom: "20px",
          }}
        />
        <h2>Verifying your payment...</h2>
        <p style={{ color: "#666", marginTop: "10px" }}>
          Please wait while we confirm your payment
        </p>
        <style jsx>{`
          @keyframes spin {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          padding: "20px",
          textAlign: "center",
        }}
      >
        <ToastContainer />
        <h2 style={{ color: "#e74c3c", marginBottom: "20px" }}>
          Payment Verification Failed
        </h2>
        <p style={{ color: "#666", marginBottom: "30px" }}>
          We couldn't verify your payment. Please check your order status or
          contact support if the payment was successful.
        </p>
        <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
          <button
            onClick={() => router.push("/orders")}
            style={{
              padding: "10px 20px",
              backgroundColor: "#ff6b00",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            View Orders
          </button>
          <button
            onClick={() => router.push("/")}
            style={{
              padding: "10px 20px",
              backgroundColor: "#95a5a6",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "50px 20px",
        textAlign: "center",
      }}
    >
      <ToastContainer />
      <div
        style={{
          fontSize: "80px",
          marginBottom: "20px",
        }}
      >
        🎉
      </div>
      <h1 style={{ marginBottom: "20px", color: "#27ae60" }}>
        Order Confirmed!
      </h1>
      <p style={{ color: "#666", marginBottom: "30px", fontSize: "18px" }}>
        Your order has been placed successfully. You will receive a confirmation
        email shortly.
      </p>
      <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
        <button
          onClick={() => router.push("/orders")}
          style={{
            padding: "12px 24px",
            backgroundColor: "#ff6b00",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "bold",
          }}
        >
          View Orders
        </button>
        <button
          onClick={() => router.push("/")}
          style={{
            padding: "12px 24px",
            backgroundColor: "#95a5a6",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontSize: "16px",
          }}
        >
          Continue Shopping
        </button>
      </div>
    </div>
  );
}