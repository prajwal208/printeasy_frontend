

import React from "react";
import CustomCarousel from "@/component/CustomCarousel/CustomCarousel";
import CategoryGrid from "../CategoryGrid/CategoryGrid";
import HeroWords from "../HeroWords/HeroWords";
import ProductSection from "../ProductSection/ProductSection";
import OfferMarquee from "@/component/OfferMarquee/OfferMarquee";

import styles from "./home.module.scss";


const Home = () => {
  // const [showOffer, setShowOffer] = useState(false);

  // useEffect(() => {
  //   const idToken = Cookies.get("idToken");
  //   if (idToken) {
  //     setShowOffer(true);
  //   }
  // }, []);

  return (
    <main className={styles.homeContainer}>
      <div className={styles.offerCarouselWrapper}>
        { <OfferMarquee />}
        <CustomCarousel />
      </div>

      <CategoryGrid />
      <HeroWords />
      <ProductSection />
       
    </main>
  );
};

export default Home;
