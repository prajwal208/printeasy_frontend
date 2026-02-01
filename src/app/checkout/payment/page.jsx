"use client";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";


export default function PaymentPage() {
  const params = useSearchParams();
  const sessionId = params.get("sessionId");

  useEffect(() => {
    if (!sessionId || !window.Cashfree) return;

    document.body.style.overflow = "hidden";

    const cashfree = new window.Cashfree({ mode: "production" });

    cashfree.checkout({
      paymentSessionId: sessionId,
      redirectTarget: "#cashfree-dropin",
    });

    return () => {
      document.body.style.overflow = "";
    };
  }, [sessionId]);

  return (
    <div
      id="cashfree-dropin"
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100dvh",
        background: "#fff",
        overflow: "hidden",
      }}
    />
  );
}
