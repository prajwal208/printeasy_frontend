"use client";

import React, {
  useState,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import styles from "./shirtEditor.module.scss";
import Image from "next/image";
import { COLORS, SIZES } from "@/constants";
import api from "@/axiosInstance/axiosInstance";
import { toPng } from "html-to-image";

import fontIcon from "../../assessts/font.svg";
import letterIcon from "../../assessts/letter1.svg";
import familyIcon from "../../assessts/family.svg";
import keyboardIcon from "../../assessts/keyboard.svg";
import lineIcon from "../../assessts/Line.svg";

const ShirtEditor = forwardRef(
  (
    {
      product,
      isEditing,
      setIsEditing,
      selectedSize,
      selectedFont,
      selectedColor,
      setSelectedColor,
      setSelectedFont,
      setSelectedSize,
      text,
      setText,
    },
    ref
  ) => {
    const [fonts, setFonts] = useState([]);
    const [activeTab, setActiveTab] = useState("font");
    const [imageLoaded, setImageLoaded] = useState(false);
    const [scrollPos, setScrollPos] = useState(0);
    const [fontsLoaded, setFontsLoaded] = useState(false);
    const [showCursor, setShowCursor] = useState(true);
    const loadedFontsRef = useRef(new Set());

    const inputRef = useRef(null);
    const viewRef = useRef(null);
    const editorRef = useRef(null);

    /* ================= BLINKING CURSOR LOGIC ================= */
    useEffect(() => {
      if (isEditing) return;
      const interval = setInterval(() => {
        setShowCursor((prev) => !prev);
      }, 530);
      return () => clearInterval(interval);
    }, [isEditing]);

    const injectFontCSS = (fontFamily, fontUrl) => {
      const style = document.createElement("style");
      style.innerHTML = `
    @font-face {
      font-family: '${fontFamily}';
      src: url('${fontUrl}') format('truetype');
      font-display: swap;
    }
  `;
      document.head.appendChild(style);
    };

    /* ================= EXPOSE IMAGE CAPTURE ================= */
    useImperativeHandle(ref, () => ({
      captureImage: async () => {
        if (!editorRef.current) return null;

        const selectedFontObj = fonts.find((f) => f.family === selectedFont);

        if (selectedFontObj) {
          injectFontCSS(selectedFontObj.family, selectedFontObj.downloadUrl);
        }

        await document.fonts.load(`16px "${selectedFont}"`);
        await document.fonts.ready;

        await new Promise((r) => setTimeout(r, 300));

        return await toPng(editorRef.current, {
          cacheBust: true,
          pixelRatio: 2,
        });
      },
    }));

    /* ================= FETCH & LOAD FONTS ================= */
    useEffect(() => {
      const fetchFonts = async () => {
        try {
          const res = await api.get("/v2/font?activeOnly=true", {
            headers: {
              "x-api-key":
                "454ccaf106998a71760f6729e7f9edaf1df17055b297b3008ff8b65a5efd7c10",
            },
          });
          setFonts(res?.data?.data || []);
        } catch (err) {
          console.error("Font fetch error:", err);
        }
      };
      fetchFonts();
    }, []);

    useEffect(() => {
      if (!fonts.length) return;
      const loadFonts = async () => {
        const fontPromises = fonts.map((font) => {
          if (loadedFontsRef.current.has(font.family)) return Promise.resolve();
          const fontFace = new FontFace(
            font.family,
            `url(${font.downloadUrl})`
          );
          return fontFace.load().then((loaded) => {
            document.fonts.add(loaded);
            loadedFontsRef.current.add(font.family);
          });
        });
        await Promise.all(fontPromises);
        setFontsLoaded(true);
      };
      loadFonts();
    }, [fonts]);

    /* ================= IOS & SCROLL LOGIC ================= */
    // const startTextEditing = () => {
    //   setIsEditing(true);

    //   if (window.innerWidth <= 768) {
    //     window.scrollTo({
    //       top: window.innerHeight * 0.3,
    //       behavior: "smooth",
    //     });
    //   }

    //   requestAnimationFrame(() => {
    //     console.log("inputRef.current", inputRef.current);
    //     if (inputRef.current) {
    //       inputRef.current.focus();
    //       const len = inputRef.current.value.length;
    //       inputRef.current.setSelectionRange(len, len);
    //     }
    //   });
    // };

    const startTextEditing = () => {
      // ✅ MUST be first (synchronous)
      if (inputRef.current) {
        inputRef.current.focus();
        const len = inputRef.current.value.length;
        inputRef.current.setSelectionRange(len, len);
      }

      // Now safe to update state
      setIsEditing(true);

      // Optional scroll (after focus)
      if (window.innerWidth <= 768) {
        setTimeout(() => {
          window.scrollTo({
            top: window.innerHeight * 0.3,
            behavior: "smooth",
          });
        }, 50);
      }
    };

    const handleBlur = (e) => {
      // Keep open if clicking toolbar buttons
      if (e.relatedTarget && editorRef.current?.contains(e.relatedTarget))
        return;
      setIsEditing(false);
    };

    /* ================= SELECTION HANDLERS ================= */
    const onFontSelect = (font) => {
      setSelectedFont(font.family);
      inputRef.current?.focus();
    };
    const onColorSelect = (c) => {
      setSelectedColor(c);
      inputRef.current?.focus();
    };
    const onSizeSelect = (s) => {
      setSelectedSize(s);
      inputRef.current?.focus();
    };

    const dynamicStyles = {
      color: selectedColor,
      fontFamily: `${selectedFont}, Arial, sans-serif`,
      fontSize: `${selectedSize}px`,
    };

    return (
      <section
        className={styles.img_main_wrap}
        ref={editorRef}
        tabIndex="-1"
        style={{ outline: "none" }}
      >
        <div className={styles.img_wrap}>
          {!imageLoaded && (
            <div className={styles.shimmerWrapper}>
              <div className={styles.shimmer} />
            </div>
          )}

          <Image
            src={product?.canvasImage}
            alt="product"
            width={500}
            height={600}
            className={styles.mainImage}
            priority
            unoptimized
            onLoadingComplete={() => setImageLoaded(true)}
            style={{
              opacity: imageLoaded ? 1 : 0,
              transition: "opacity 0.2s ease",
            }}
          />

          {product &&
            (isEditing ? (
              // <textarea
              //   ref={inputRef}
              //   className={`${styles.presetText} ${styles.editInput}`}
              //   value={text}
              //   onChange={(e) => setText(e.target.value)}
              //   onBlur={handleBlur}
              //   onKeyDown={(e) =>
              //     e.key === "Enter" && !e.shiftKey && handleBlur({})
              //   }
              //   style={dynamicStyles}
              // />

              <textarea
                ref={inputRef}
                className={`${styles.presetText} ${styles.editInput}`}
                value={text}
                onChange={(e) => setText(e.target.value)}
                style={dynamicStyles}
                onBlur={handleBlur}
                inputMode="text"
              />
            ) : (
              <div
                ref={viewRef}
                className={styles.presetText}
                onClick={startTextEditing}
                style={{ ...dynamicStyles, cursor: "text" }}
              >
                {text.trim() || "Your Text Here"}

                <span
                  style={{
                    opacity: showCursor ? 1 : 0,
                    transition: "opacity 0.1s",
                    marginLeft: "2px",
                    fontWeight: "100",
                    color: selectedColor,
                  }}
                >
                  |
                </span>
              </div>
            ))}

          {isEditing && (
            <div
              className={styles.floatingToolbar}
              tabIndex="-1"
              style={{ outline: "none" }}
            >
              <button
                onClick={() => setActiveTab("size")}
                className={`${styles.toolButton} ${
                  activeTab === "size" ? styles.activeTool : ""
                }`}
              >
                <Image src={letterIcon} alt="size" />
                <span>Font Size</span>
              </button>

              <button
                onClick={() => setActiveTab("color")}
                className={`${styles.toolButton} ${
                  activeTab === "color" ? styles.activeTool : ""
                }`}
              >
                <Image src={fontIcon} alt="color" />
                <span>Colour</span>
              </button>

              <button
                onClick={() => setActiveTab("font")}
                className={`${styles.toolButton} ${
                  activeTab === "font" ? styles.activeTool : ""
                }`}
              >
                <Image src={familyIcon} alt="font" />
                <span>Fonts</span>
              </button>

              <div className={styles.toolButton} onClick={startTextEditing}>
                <Image src={keyboardIcon} alt="edit" />
                <span>Edit</span>
              </div>

              <button
                className={styles.closeToolbarBtn}
                onClick={() => setIsEditing(false)}
              >
                ×
              </button>

              <div className={styles.optionsPanel}>
                {activeTab === "font" && (
                  <div className={styles.fontOptions}>
                    {fonts.map((font) => (
                      <button
                        key={font.family}
                        onClick={() => onFontSelect(font)}
                        className={`${styles.fontOption} ${
                          selectedFont === font.family ? styles.active : ""
                        }`}
                        style={{ fontFamily: font.family }}
                      >
                        {font.family}
                        <Image src={lineIcon} alt="line" />
                      </button>
                    ))}
                  </div>
                )}

                {activeTab === "color" && (
                  <div className={styles.colorOptions}>
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => onColorSelect(c)}
                        className={`${styles.colorSwatch} ${
                          selectedColor === c ? styles.activeColor : ""
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                )}

                {activeTab === "size" && (
                  <div className={styles.sizeOptions}>
                    {SIZES.map((s) => (
                      <button
                        key={s}
                        onClick={() => onSizeSelect(s)}
                        className={`${styles.sizeBtn} ${
                          selectedSize === s ? styles.activeSize : ""
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    );
  }
);

export default ShirtEditor;
