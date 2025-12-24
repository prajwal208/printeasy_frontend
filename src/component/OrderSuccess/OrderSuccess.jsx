"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, XCircle, Loader2, ArrowRight } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from "@/axiosInstance/axiosInstance";
import Cookies from "js-cookie";
import { db } from "@/lib/db";
import styles from './ordersuccess.module.scss'


const OrderSuccess = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const accessToken = Cookies.get("idToken");

  const [status, setStatus] = useState("loading"); // loading, success, error
  const [orderData, setOrderData] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    verifyPayment();
  }, []);

  const verifyPayment = async () => {
    try {
      // Get order info from localStorage (stored in Cart.jsx)
      const pendingOrderId = localStorage.getItem("pendingOrderId");
      const pendingCashfreeOrderId = localStorage.getItem("pendingCashfreeOrderId");

      if (!pendingOrderId || !pendingCashfreeOrderId) {
        // Try to get from URL params (if Cashfree redirects with data)
        const orderId = searchParams.get("orderId");
        const cashfreeOrderId = searchParams.get("order_id") || searchParams.get("cashfreeOrderId");
        
        if (!orderId || !cashfreeOrderId) {
          setStatus("error");
          setErrorMessage("Order information not found. Please check your order history.");
          setIsVerifying(false);
          return;
        }

        // If we have params, try direct verification first
        await verifyPaymentWithParams(orderId, cashfreeOrderId);
        return;
      }

      // Method 1: Poll payment status (recommended - more reliable)
      await pollPaymentStatus(pendingOrderId, pendingCashfreeOrderId);
    } catch (error) {
      console.error("Payment verification error:", error);
      setStatus("error");
      setErrorMessage(
        error.response?.data?.message || "Failed to verify payment. Please contact support."
      );
      setIsVerifying(false);
    }
  };

  // Verify payment using URL params (if Cashfree redirects with data)
  const verifyPaymentWithParams = async (orderId, cashfreeOrderId) => {
    try {
      const orderAmount = searchParams.get("order_amount");
      const referenceId = searchParams.get("reference_id") || searchParams.get("cf_payment_id");
      const txStatus = searchParams.get("tx_status") || searchParams.get("payment_status");
      const paymentMode = searchParams.get("payment_mode");
      const txMsg = searchParams.get("tx_msg") || searchParams.get("payment_message");
      const txTime = searchParams.get("tx_time") || searchParams.get("payment_time");
      const cashfreeSignature = searchParams.get("signature");

      if (!orderId || !cashfreeOrderId || !referenceId || !txStatus) {
        // If params incomplete, fall back to polling
        await pollPaymentStatus(orderId, cashfreeOrderId);
        return;
      }

      const res = await api.post(`/v1/payments/verify`,
        {
          orderId,
          cashfreeOrderId,
          orderAmount: orderAmount || localStorage.getItem("grandTotal") || "0",
          referenceId,
          txStatus,
          paymentMode: paymentMode || "ONLINE",
          txMsg: txMsg || "",
          txTime: txTime || new Date().toISOString(),
          cashfreeSignature: cashfreeSignature || "API_VERIFIED",
        },
        {
           headers: {
          "x-api-key":
            "454ccaf106998a71760f6729e7f9edaf1df17055b297b3008ff8b65a5efd7c10",
        },
        }
      );

      if (res.data.success) {
        handleSuccess(res.data.data);
      } else {
        setStatus("error");
        setErrorMessage(res.data.message || "Payment verification failed");
        setIsVerifying(false);
      }
    } catch (error) {
      console.error("Direct verification failed, trying polling:", error);
      // Fall back to polling
      const orderId = searchParams.get("orderId") || localStorage.getItem("pendingOrderId");
      const cashfreeOrderId = searchParams.get("order_id") || localStorage.getItem("pendingCashfreeOrderId");
      if (orderId && cashfreeOrderId) {
        await pollPaymentStatus(orderId, cashfreeOrderId);
      } else {
        setStatus("error");
        setErrorMessage("Failed to verify payment");
        setIsVerifying(false);
      }
    }
  };

  // Poll payment status (more reliable method)
  const pollPaymentStatus = async (orderId, cashfreeOrderId, retries = 0) => {
    const maxRetries = 10; // Poll for up to 10 times
    const pollInterval = 2000; // 2 seconds between polls

    try {
      const res = await api.post(`/v1/payments/status`,
        {
          orderId,
          cashfreeOrderId,
        },
        {
          headers: {
          "x-api-key":
            "454ccaf106998a71760f6729e7f9edaf1df17055b297b3008ff8b65a5efd7c10",
        },
        }
      );

      const data = res.data.data || res.data;

      // Check if payment is successful
      if (data.isSuccess || data.status === "CONFIRMED") {
        handleSuccess(data);
        return;
      }

      // Check if payment failed
      if (data.paymentStatus === "FAILED" || data.orderStatus === "CANCELLED") {
        setStatus("error");
        setErrorMessage("Payment failed or was cancelled");
        setIsVerifying(false);
        return;
      }

      // If still pending and we have retries left, poll again
      if (retries < maxRetries && (data.paymentStatus === "PENDING" || !data.isSuccess)) {
        setTimeout(() => {
          pollPaymentStatus(orderId, cashfreeOrderId, retries + 1);
        }, pollInterval);
      } else {
        // Max retries reached or payment still pending
        setStatus("error");
        setErrorMessage(
          "Payment verification is taking longer than expected. Please check your order status in your account."
        );
        setIsVerifying(false);
      }
    } catch (error) {
      console.error("Polling error:", error);
      if (retries < maxRetries) {
        // Retry on error
        setTimeout(() => {
          pollPaymentStatus(orderId, cashfreeOrderId, retries + 1);
        }, pollInterval);
      } else {
        setStatus("error");
        setErrorMessage(
          error.response?.data?.message || "Failed to verify payment. Please contact support."
        );
        setIsVerifying(false);
      }
    }
  };

  const handleSuccess = (data) => {
    setStatus("success");
    setOrderData(data);
    setIsVerifying(false);

    // Clear localStorage
    localStorage.removeItem("pendingOrderId");
    localStorage.removeItem("pendingCashfreeOrderId");
    localStorage.removeItem("grandTotal");

    // Clear cart from IndexedDB
    db.cart.clear()
      .then(() => {
        console.log("Cart cleared successfully");
      })
      .catch((err) => {
        console.error("Error clearing cart:", err);
      });

    toast.success("Order placed successfully! 🎉");
  };

  return (
    <div className={styles.orderSuccessPage}>
      <ToastContainer position="top-right" autoClose={3000} />
      
      {status === "loading" && (
        <div className={styles.loadingContainer}>
          <Loader2 className={styles.spinner} size={48} />
          <h2>Verifying your payment...</h2>
          <p>Please wait while we confirm your order</p>
        </div>
      )}

      {status === "success" && (
        <div className={styles.successContainer}>
          <div className={styles.successIcon}>
            <CheckCircle size={80} color="#10B981" />
          </div>
          <h1 className={styles.successTitle}>Order Placed Successfully!</h1>
          <p className={styles.successMessage}>
            Thank you for your purchase. Your order has been confirmed.
          </p>

          {orderData && (
            <div className={styles.orderDetails}>
              <div className={styles.detailCard}>
                <h3>Order Details</h3>
                <div className={styles.detailRow}>
                  <span>Order ID:</span>
                  <strong>{orderData.orderId || "N/A"}</strong>
                </div>
                {orderData.cashfree?.referenceId && (
                  <div className={styles.detailRow}>
                    <span>Payment Reference:</span>
                    <strong>{orderData.cashfree.referenceId}</strong>
                  </div>
                )}
                {orderData.shiprocket?.shipmentId && (
                  <div className={styles.detailRow}>
                    <span>Shipment ID:</span>
                    <strong>{orderData.shiprocket.shipmentId}</strong>
                  </div>
                )}
                <div className={styles.detailRow}>
                  <span>Status:</span>
                  <strong className={styles.statusConfirmed}>
                    {orderData.status || "CONFIRMED"}
                  </strong>
                </div>
              </div>
            </div>
          )}

          <div className={styles.actionButtons}>
            <button
              className={styles.primaryButton}
              onClick={() => router.push("/orders")}
            >
              View My Orders
              <ArrowRight size={20} />
            </button>
            <button
              className={styles.secondaryButton}
              onClick={() => router.push("/")}
            >
              Continue Shopping
            </button>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className={styles.errorContainer}>
          <div className={styles.errorIcon}>
            <XCircle size={80} color="#EF4444" />
          </div>
          <h1 className={styles.errorTitle}>Payment Verification Failed</h1>
          <p className={styles.errorMessage}>{errorMessage}</p>

          <div className={styles.actionButtons}>
            <button
              className={styles.primaryButton}
              onClick={() => router.push("/orders")}
            >
              Check Order Status
            </button>
            <button
              className={styles.secondaryButton}
              onClick={() => router.push("/cart")}
            >
              Back to Cart
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderSuccess;