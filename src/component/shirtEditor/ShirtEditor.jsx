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

const ShirtEditor = forwardRef(({ product }, ref) => {
  const [text, setText] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [fonts, setFonts] = useState([]);
  const [selectedSize, setSelectedSize] = useState(28);
  const [selectedFont, setSelectedFont] = useState("Arial");
  const [selectedColor, setSelectedColor] = useState("#ffffff");
  const [activeTab, setActiveTab] = useState("font");
  const [imageLoaded, setImageLoaded] = useState(false);
  const [scrollPos, setScrollPos] = useState(0);

  const inputRef = useRef(null);
  const viewRef = useRef(null);
  const editorRef = useRef(null);

  /* ================= INIT FROM PRODUCT ================= */
  useEffect(() => {
    if (product) {
      setText(product.presetText || "");
      setSelectedColor(product.fontColor || "#ffffff");
      setSelectedFont(product.fontFamily || "Arial");
      setSelectedSize(product.fontSize || 28);
    }
  }, [product]);

  /* ================= EXPOSE IMAGE CAPTURE ================= */
  useImperativeHandle(ref, () => ({
    captureImage: async () => {
      if (!editorRef.current) return null;

      try {
        await new Promise((r) => setTimeout(r, 100));

        const dataUrl = await toPng(editorRef.current, {
          cacheBust: true,
          pixelRatio: 2,
        });

        return dataUrl;
      } catch (err) {
        console.error("Capture failed:", err);
        return null;
      }
    },
  }));

  /* ================= FETCH FONTS ================= */
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

  /* ================= LOAD DYNAMIC FONTS ================= */
  useEffect(() => {
    if (!fonts.length) return;

    const styleId = "dynamic-fonts";
    let styleTag = document.getElementById(styleId);

    if (!styleTag) {
      styleTag = document.createElement("style");
      styleTag.id = styleId;
      document.head.appendChild(styleTag);
    }

    styleTag.innerHTML = fonts
      .map(
        (f) =>
          `@font-face {
            font-family: '${f.family}';
            src: url('${f.downloadUrl}') format('truetype');
            font-display: swap;
          }`
      )
      .join("\n");
  }, [fonts]);

  /* ================= TEXT EDIT HANDLERS ================= */
  const handleBlur = () => {
    if (inputRef.current) {
      setScrollPos(inputRef.current.scrollTop);
    }
    setIsEditing(false);
  };

  useEffect(() => {
    if (!isEditing && viewRef.current) {
      viewRef.current.scrollTop = scrollPos;
    }
  }, [isEditing, scrollPos]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleBlur();
    }
  };

  const startTextEditing = () => {
    setIsEditing(true);
    setActiveTab(null);

    setTimeout(() => {
      if (inputRef.current) {
        const len = inputRef.current.value.length;
        inputRef.current.focus();
        inputRef.current.setSelectionRange(len, len);
      }
    }, 0);
  };

  /* ================= SELECTION HANDLERS ================= */
  const onFontSelect = (font) => setSelectedFont(font.family);
  const onColorSelect = (c) => setSelectedColor(c);
  const onSizeSelect = (s) => setSelectedSize(s);

  /* ================= DYNAMIC STYLES ================= */
  const dynamicStyles = {
    color: selectedColor,
    fontFamily: `'${selectedFont}', sans-serif`,
    fontSize: `${selectedSize}px`,
  };

  console.log(imageLoaded, "oopopopopccxxxvvvv");

  return (
    <section className={styles.img_main_wrap} ref={editorRef}>
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
          // Ensure the image doesn't pop in abruptly
          style={{
            opacity: imageLoaded ? 1 : 0,
            transition: "opacity 0.3s ease",
          }}
        />

        {/* TEXT LAYER */}
        {isEditing ? (
          <textarea
            ref={inputRef}
            className={`${styles.presetText} ${styles.editInput}`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            style={dynamicStyles}
          />
        ) : (
          <div
            ref={viewRef}
            className={styles.presetText}
            onClick={() => setIsEditing(true)}
            style={dynamicStyles}
          >
            {text.trim() || "Your Text Here"}
          </div>
        )}

        {isEditing && (
          <div className={styles.floatingToolbar}>
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
});

export default ShirtEditor;
