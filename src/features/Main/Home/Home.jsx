"use client";

import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import CustomCarousel from "@/component/CustomCarousel/CustomCarousel";
import CategoryGrid from "../CategoryGrid/CategoryGrid";
import HeroWords from "../HeroWords/HeroWords";
import ProductSection from "../ProductSection/ProductSection";
import OfferMarquee from "@/component/OfferMarquee/OfferMarquee";

const Home = () => {
  const [showOffer, setShowOffer] = useState(false);

  useEffect(() => {
    const idToken = Cookies.get("idToken");
    if (idToken) {
      setShowOffer(true);
    }
  }, []);

  return (
    <main>
      {showOffer && <OfferMarquee />}
      <CustomCarousel />
      <CategoryGrid />
      <HeroWords />
      <ProductSection />
    </main>
  );
};

export default Home;
