"use client";

import React, { useMemo } from "react";
import styles from "./HeroWords.module.scss";
import { Poppins, Montserrat, Raleway, Rubik, Nunito } from "next/font/google";

// Load fonts
const poppins = Poppins({ weight: ["400", "600"], subsets: ["latin"] });
const montserrat = Montserrat({ weight: ["500", "700"], subsets: ["latin"] });
const raleway = Raleway({ weight: ["500"], subsets: ["latin"] });
const rubik = Rubik({ weight: ["500", "700"], subsets: ["latin"] });
const nunito = Nunito({ weight: ["600"], subsets: ["latin"] });

const words = [
  "Be Brave. Be Bold.",
  "My Hero",
  "Little Hero",
  "My Power. My Rules.",
  "Born to Save the Day",
  "Power Mode On",
  "Future Avenger",
  "I’ve Got Superpowers",
  "Future Avenger",
  "Little Hero",
];

const fonts = [
  poppins.className,
  montserrat.className,
  raleway.className,
  rubik.className,
  nunito.className,
];

const HeroWords = () => {
  const randomStyles = useMemo(() => {
    const placed = [];

    const getNonOverlappingPosition = () => {
      let top, left;
      let tries = 0;
      const minDistance = 80; // distance between words

      while (tries < 200) {
        top = Math.random() * 80;
        left = Math.random() * 80;

        const overlap = placed.some(
          (p) => Math.abs(p.top - top) < 10 && Math.abs(p.left - left) < 15
        );

        if (!overlap) {
          placed.push({ top, left });
          break;
        }
        tries++;
      }

      return { top: `${top}%`, left: `${left}%` };
    };

    return words.map(() => {
      const { top, left } = getNonOverlappingPosition();
      return {
        top,
        left,
        fontSize: `${Math.random() * 1.2 + 1}rem`,
        animationDuration: `${Math.random() * 5 + 6}s`,
        animationDelay: `${Math.random() * 2}s`,
        fontClass: fonts[Math.floor(Math.random() * fonts.length)],
        direction: Math.random() > 0.5 ? 1 : -1,
      };
    });
  }, []);

  return (
    <>
      <main className={styles.heroword_main_wrap}>
        <h1>YOUR WORDS, YOUR STYLE</h1>
        <div className={styles.container}>
          {words.map((word, i) => (
            <span
              key={i}
              className={`${styles.word} ${randomStyles[i].fontClass}`}
              style={{
                top: randomStyles[i].top,
                left: randomStyles[i].left,
                fontSize: randomStyles[i].fontSize,
                animationDuration: randomStyles[i].animationDuration,
                animationDelay: randomStyles[i].animationDelay,
                "--direction": randomStyles[i].direction,
              }}
            >
              {word}
            </span>
          ))}
        </div>
      </main>
    </>
  );
};

export default HeroWords;
