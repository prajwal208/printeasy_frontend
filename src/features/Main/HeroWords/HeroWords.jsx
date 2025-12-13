"use client";

import { useEffect } from "react";
import styles from "./HeroWords.module.scss";

const names = [
  "Super Aarav", "Nautanki Vihaan", "Drama Queen Diya", "Maasi’s Jaan Riya",
  "Papa’s Pari Ananya", "Future Cricketer Virat", "Chota Don Kabir",
  "Rowdy Reyansh", "Dadi’s Ladla Arjun", "Sher Dil Aditya",
  "Hero No.1 Ishaan", "Little Miss Saanvi", "Rockstar Vivaan",
  "Boss Baby Ruhi", "Attitude King Samar", "Smile Please Siya"
];

const shorts = ["VIBE", "LIT", "EPIC", "BOSS", "ICON", "SWAG", "RAD", "XOXO"];

const colors = [
  "#ff4d00",
  "#3b82f6",
  "#f472b6",
  "#22c55e",
  "#eab308",
  "#ffffff"
];

export default function HeroWords() {
  useEffect(() => {
    const tracks = ["track-1", "track-2", "track-3", "track-4"];

    tracks.forEach((id) => fillTrack(id));
  }, []);

  const fillTrack = (trackId) => {
    const track = document.getElementById(trackId);
    if (!track) return;

    track.innerHTML = "";

    const combined = shuffle([...names, ...shorts]);
    const list = [...combined, ...combined]; // seamless loop

    list.forEach((text) => {
      const item = document.createElement("div");
      item.className = styles.tickerItem;
      item.innerText = text;
      setRandomColor(item);

      item.onclick = () => setRandomColor(item);
      track.appendChild(item);
    });
  };

  const setRandomColor = (el) => {
    el.style.backgroundColor =
      colors[Math.floor(Math.random() * colors.length)];
  };

  const shuffle = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  return (
    <section className={styles.wrapper}>
      <div className={styles.tickerContainer}>
        <div className={styles.tickerWrapper}>
          <div id="track-1" className={`${styles.tickerTrack} ${styles.left}`} />
        </div>

        <div className={styles.tickerWrapper}>
          <div id="track-2" className={`${styles.tickerTrack} ${styles.right}`} />
        </div>

        <div className={styles.tickerWrapper}>
          <div id="track-3" className={`${styles.tickerTrack} ${styles.left}`} />
        </div>

        <div className={styles.tickerWrapper}>
          <div id="track-4" className={`${styles.tickerTrack} ${styles.right}`} />
        </div>
      </div>
    </section>
  );
}
