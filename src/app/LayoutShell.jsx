"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Navbar from "@/features/Main/Navbar/Navbar";
import Footer from "@/features/footer/Footer";

export default function LayoutShell({ children }) {
  const pathname = usePathname();
  const isPaymentPage = pathname.startsWith("/checkout/payment");

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile(); // initial check
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const hideNavbar = isPaymentPage || isMobile;

  return (
    <>
      {!hideNavbar && <Navbar />}
      {children}
      {!isPaymentPage && <Footer />}
    </>
  );
}
