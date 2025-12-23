"use client";
import React, { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/axiosInstance/axiosInstance";
import { db } from "@/lib/db";
import { toast, ToastContainer } from "react-toastify";

export default function OrderSuccess() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("loading");
  const intervalRef = useRef(null);
  const startTime = useRef(Date.now());

  useEffect(() => {
    // 1. Get IDs from URL (Cashfree appends these) or fallback to localStorage
    const urlOrderId = searchParams.get("order_id");
    const orderId = urlOrderId || localStorage.getItem("pendingOrderId");
    const cashfreeOrderId = localStorage.getItem("pendingCashfreeOrderId");

    if (!orderId) {
      console.error("No Order ID found in URL or LocalStorage");
      setStatus("error");
      return;
    }

    // Define the polling function
    const pollStatus = async () => {
      // Timeout after 5 minutes
      if (Date.now() - startTime.current > 5 * 60 * 1000) {
        clearInterval(intervalRef.current);
        setStatus("error");
        toast.error("Verification timed out. Please check your email for confirmation.");
        return;
      }

      try {
        const res = await api.post("/v1/payment/status", {
          orderId,
          cashfreeOrderId: cashfreeOrderId || orderId,
        });

        const { isSuccess, paymentStatus, orderStatus } = res.data.data || {};

        // If backend confirms payment is SUCCESS and order is CONFIRMED
        if (isSuccess || orderStatus === "CONFIRMED") {
          clearInterval(intervalRef.current);
          
          // Cleanup
          localStorage.removeItem("pendingOrderId");
          localStorage.removeItem("pendingCashfreeOrderId");
          await db.cart.clear();
          
          setStatus("success");
        } 
        
        // If payment explicitly failed
        else if (["FAILED", "CANCELLED", "USER_DROPPED"].includes(paymentStatus)) {
          clearInterval(intervalRef.current);
          setStatus("error");
        }
      } catch (e) {
        console.error("Polling error:", e);
        // We don't stop the interval on network error, just wait for next tick
      }
    };

    // Start polling every 3 seconds
    pollStatus(); 
    intervalRef.current = setInterval(pollStatus, 3000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [searchParams]);

  // UI States
  if (status === "loading") {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <h2>Verifying your payment...</h2>
        <p>Please do not refresh the page.</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <ToastContainer />
        <h2 style={{ color: "red" }}>Payment Not Confirmed</h2>
        <p>We couldn't verify your payment. If money was deducted, it will be refunded or your order will update shortly.</p>
        <button onClick={() => router.push("/orders")} style={{ padding: "10px 20px", marginTop: "20px" }}>
          Go to My Orders
        </button>
      </div>
    );
  }

  return (
    <div style={{ textAlign: "center", padding: "50px" }}>
      <ToastContainer />
      <h1 style={{ color: "green" }}>🎉 Order Successfully Placed!</h1>
      <p>Thank you for your purchase. Your order is being processed.</p>
      <div style={{ marginTop: "30px" }}>
        <button onClick={() => router.push("/orders")} style={{ padding: "10px 20px", marginRight: "10px" }}>
          Track Order
        </button>
        <button onClick={() => router.push("/")} style={{ padding: "10px 20px" }}>
          Continue Shopping
        </button>
      </div>
    </div>
  );
}