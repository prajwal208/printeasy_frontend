"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { db } from "@/lib/db";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from "@/axiosInstance/axiosInstance";

const OrderSuccessPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const verifyPayment = async () => {
      const txStatus = searchParams.get("txStatus");
      if (!txStatus) {
        // If no payment info, redirect to home/cart
        // router.push("/");
        alert("payment unkow")
        return;
      }

      const payload = {
        orderId: searchParams.get("orderId"),           // internal orderId
        cashfreeOrderId: searchParams.get("orderId"),   // Cashfree orderId
        orderAmount: searchParams.get("orderAmount"),
        referenceId: searchParams.get("referenceId"),
        txStatus: searchParams.get("txStatus"),
        paymentMode: searchParams.get("paymentMode"),
        txMsg: searchParams.get("txMsg"),
        txTime: searchParams.get("txTime"),
        cashfreeSignature: searchParams.get("signature"),
      };

      try {
        setLoading(true);

        await api.patch("/v1/payment/verify", payload, {
          headers: {
            "x-api-key":
              "454ccaf106998a71760f6729e7f9edaf1df17055b297b3008ff8b65a5efd7c10",
          },
        });

        // Clear cart only after successful verification
        await db.cart.clear();

        toast.success("Order Confirmed 🎉");
        setSuccess(true);
      } catch (error) {
        console.error("Payment verification failed", error);
        toast.error("Payment verification failed. Please contact support.");
        setSuccess(false);
      } finally {
        setLoading(false);
        // Remove query params so refresh doesn't re-trigger verification
        window.history.replaceState({}, "", "/order-success");
      }
    };

    verifyPayment();
  }, [searchParams, router]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <p>Verifying your payment, please wait...</p>
      </div>
    );
  }

  if (!success) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <h2>Payment Verification Failed</h2>
        <p>Please contact support if your amount was debited.</p>
        <button onClick={() => router.push("/")}>Go to Home</button>
      </div>
    );
  }

  return (
    <div style={{ textAlign: "center", padding: "50px" }}>
      <ToastContainer position="top-right" autoClose={3000} />
      <h1>🎉 Order Confirmed</h1>
      <p>Your payment was successful and your order has been placed.</p>
      <button
        onClick={() => router.push("/orders")}
        style={{
          padding: "10px 20px",
          marginTop: "20px",
          border: "none",
          borderRadius: "6px",
          backgroundColor: "#4CAF50",
          color: "#fff",
          cursor: "pointer",
        }}
      >
        View My Orders
      </button>
    </div>
  );
};

export default OrderSuccessPage;
