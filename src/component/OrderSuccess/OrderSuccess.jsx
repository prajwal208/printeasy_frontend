"use client";
import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/axiosInstance/axiosInstance";
import { db } from "@/lib/db";
import { toast, ToastContainer } from "react-toastify";

export default function OrderSuccess() {
  const router = useRouter();
  const [status, setStatus] = useState("loading");
  const intervalRef = useRef(null);
  const startTime = useRef(Date.now());

  useEffect(() => {
    const orderId = localStorage.getItem("pendingOrderId");
    const cashfreeOrderId = localStorage.getItem("pendingCashfreeOrderId");

    if (!orderId || !cashfreeOrderId) {
      setStatus("error");
      return;
    }

    poll(orderId, cashfreeOrderId);

    intervalRef.current = setInterval(() => {
      if (Date.now() - startTime.current > 5 * 60 * 1000) {
        clearInterval(intervalRef.current);
        setStatus("error");
      } else {
        poll(orderId, cashfreeOrderId);
      }
    }, 3000);

    return () => clearInterval(intervalRef.current);
  }, []);

  const poll = async (orderId, cashfreeOrderId) => {
    try {
      const res = await api.post("/v1/payment/status", {
        orderId,
        cashfreeOrderId,
      });

      const { isSuccess, paymentStatus } = res.data.data || {};

      if (isSuccess) {
        clearInterval(intervalRef.current);
        localStorage.clear();
        await db.cart.clear();
        setStatus("success");
      }

      if (
        ["FAILED", "CANCELLED", "USER_DROPPED"].includes(paymentStatus)
      ) {
        clearInterval(intervalRef.current);
        setStatus("error");
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (status === "loading") {
    return <h2>Verifying payment...</h2>;
  }

  if (status === "error") {
    return (
      <>
        <ToastContainer />
        <h2>Payment failed</h2>
        <button onClick={() => router.push("/orders")}>
          View Orders
        </button>
      </>
    );
  }

  return (
    <>
      <ToastContainer />
      <h1>🎉 Order Confirmed</h1>
      <button onClick={() => router.push("/orders")}>
        View Orders
      </button>
    </>
  );
}
