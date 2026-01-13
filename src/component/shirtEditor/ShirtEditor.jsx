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
import html2canvas from "html2canvas";

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
      onReady,
    },
    ref
  ) => {
    const [fonts, setFonts] = useState([]);
    const [activeTab, setActiveTab] = useState("font");
    const [imageLoaded, setImageLoaded] = useState(false);
    const [fontsLoaded, setFontsLoaded] = useState(false);
    const [showCursor, setShowCursor] = useState(true);
    const [imageError, setImageError] = useState(false);
    const [imageDataUrl, setImageDataUrl] = useState(null);
    const loadedFontsRef = useRef(new Set());

    const inputRef = useRef(null);
    const viewRef = useRef(null);
    const editorRef = useRef(null);

    /* ================= NOTIFY PARENT WHEN EDITOR IS READY ================= */
    useEffect(() => {
      if (imageLoaded && fontsLoaded) {
        console.log("✅ ShirtEditor fully ready");
        onReady?.();
      }
    }, [imageLoaded, fontsLoaded, onReady]);

    /* ================= BLINKING CURSOR LOGIC ================= */
    useEffect(() => {
      if (isEditing) return;
      const interval = setInterval(() => {
        setShowCursor((prev) => !prev);
      }, 530);
      return () => clearInterval(interval);
    }, [isEditing]);

    /* ================= CONVERT IMAGE TO BASE64 FOR iOS ================= */
    useEffect(() => {
      if (!product?.canvasImage) return;

      const loadAndConvertImage = async () => {
        try {
          console.log("🖼️ Loading image:", product.canvasImage);

          // Method 1: Try loading directly with CORS
          const img = new window.Image();
          img.crossOrigin = "anonymous";

          const loadPromise = new Promise((resolve, reject) => {
            img.onload = () => {
              console.log("✅ Image loaded with CORS");
              try {
                // Convert to base64
                const canvas = document.createElement("canvas");
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0);
                const dataUrl = canvas.toDataURL("image/png");
                setImageDataUrl(dataUrl);
                setImageLoaded(true);
                setImageError(false);
                resolve();
              } catch (err) {
                console.error("Canvas conversion error:", err);
                reject(err);
              }
            };

            img.onerror = (error) => {
              console.warn("⚠️ CORS load failed, trying proxy method...");
              reject(error);
            };

            // Add timestamp to prevent caching issues on iOS
            const separator = product.canvasImage.includes("?") ? "&" : "?";
            img.src = `${product.canvasImage}${separator}_t=${Date.now()}`;
          });

          try {
            await loadPromise;
          } catch (corsError) {
            // Method 2: Fallback - load without CORS (won't work for capture but shows image)
            console.log("🔄 Trying fallback load...");
            const fallbackImg = new window.Image();

            fallbackImg.onload = () => {
              console.log("✅ Image loaded (fallback mode)");
              setImageDataUrl(product.canvasImage);
              setImageLoaded(true);
              setImageError(false);
            };

            fallbackImg.onerror = () => {
              console.error("❌ All loading methods failed");
              setImageError(true);
            };

            fallbackImg.src = product.canvasImage;
          }
        } catch (error) {
          console.error("❌ Image loading error:", error);
          setImageError(true);
        }
      };

      loadAndConvertImage();
    }, [product?.canvasImage]);

    const injectFontCSS = (fontFamily, fontUrl) => {
      const existingStyle = document.querySelector(
        `style[data-font="${fontFamily}"]`
      );
      if (existingStyle) return;

      const style = document.createElement("style");
      style.setAttribute("data-font", fontFamily);
      style.innerHTML = `
        @font-face {
          font-family: '${fontFamily}';
          src: url('${fontUrl}') format('truetype');
          font-display: swap;
        }
      `;
      document.head.appendChild(style);
    };

    /* ================= IMAGE CAPTURE WITH html2canvas ================= */
    useImperativeHandle(ref, () => ({
      captureImage: async () => {
        if (!editorRef.current) {
          console.error("❌ Editor ref not found");
          return null;
        }

        try {
          // Load selected font
          const selectedFontObj = fonts.find((f) => f.family === selectedFont);
          if (selectedFontObj) {
            injectFontCSS(selectedFontObj.family, selectedFontObj.downloadUrl);
          }

          await document.fonts.ready;

          await new Promise((resolve) => setTimeout(resolve, 500));

          console.log("📷 Capturing with html2canvas...");

          const canvas = await html2canvas(editorRef.current, {
            allowTaint: true,
            useCORS: true,
            scale: 2,
            backgroundColor: null,
            logging: true,
            imageTimeout: 15000,
            removeContainer: true,
            // iOS-specific options
            foreignObjectRendering: false,
            onclone: (clonedDoc) => {
              console.log("🔄 Cloning document for capture...");
              // Ensure all images are loaded in the clone
              const images = clonedDoc.querySelectorAll("img");
              images.forEach((img) => {
                if (!img.complete) {
                  console.warn("⚠️ Image not complete in clone");
                }
              });
            },
          });

          console.log("✅ Canvas created successfully");

          // Convert canvas to data URL
          const dataUrl = canvas.toDataURL("image/png", 1.0);
          console.log("✅ Capture complete!");

          return dataUrl;
        } catch (error) {
          console.error("❌ html2canvas capture failed:", error);

          // Fallback method using simpler settings
          try {
            console.log("🔄 Trying fallback capture...");
            await new Promise((resolve) => setTimeout(resolve, 300));

            const canvas = await html2canvas(editorRef.current, {
              allowTaint: true,
              useCORS: false,
              scale: 1,
              logging: false,
            });

            return canvas.toDataURL("image/png");
          } catch (fallbackError) {
            console.error("❌ Fallback capture also failed:", fallbackError);
            return null;
          }
        }
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
          console.error("❌ Font fetch error:", err);
        }
      };
      fetchFonts();
    }, []);

    useEffect(() => {
      if (!fonts.length) return;

      const loadFonts = async () => {
        console.log(`📚 Loading ${fonts.length} fonts...`);

        const fontPromises = fonts.map((font) => {
          if (loadedFontsRef.current.has(font.family)) return Promise.resolve();

          return new Promise((resolve) => {
            const fontFace = new FontFace(
              font.family,
              `url(${font.downloadUrl})`
            );

            fontFace
              .load()
              .then((loaded) => {
                document.fonts.add(loaded);
                loadedFontsRef.current.add(font.family);
                console.log(`✅ Font loaded: ${font.family}`);
                resolve();
              })
              .catch((err) => {
                console.warn(`⚠️ Font load failed: ${font.family}`, err);
                resolve(); // Don't break the chain
              });
          });
        });

        await Promise.all(fontPromises);
        setFontsLoaded(true);
        console.log("✅ All fonts loaded");
      };

      loadFonts();
    }, [fonts]);

    const startTextEditing = () => {
      if (inputRef.current) {
        inputRef.current.focus();
        const len = inputRef.current.value.length;
        inputRef.current.setSelectionRange(len, len);
      }

      setIsEditing(true);

      // iOS scroll fix
      const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
      if (isIOS) {
        setTimeout(() => {
          window.scrollTo({
            top: window.innerHeight * 0.3,
            behavior: "smooth",
          });
        }, 100);
      }
    };

    const handleBlur = (e) => {
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
          {!imageLoaded && !imageError && (
            <div className={styles.shimmerWrapper}>
              <div className={styles.shimmer} />
            </div>
          )}

          {imageError && (
            <div
              style={{
                padding: "20px",
                textAlign: "center",
                color: "#666",
                minHeight: "400px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                background: "#f5f5f5",
                borderRadius: "8px",
              }}
            >
              <p style={{ fontSize: "48px", marginBottom: "10px" }}>⚠️</p>
              <p style={{ fontWeight: "bold", marginBottom: "5px" }}>
                Image Failed to Load
              </p>
              <p
                style={{
                  fontSize: "12px",
                  color: "#999",
                  marginBottom: "15px",
                }}
              >
                {product?.canvasImage?.substring(0, 60)}...
              </p>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: "12px 24px",
                  background: "#000",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                Reload Page
              </button>
            </div>
          )}

          {imageDataUrl && (
            <img
              src={imageDataUrl}
              alt="product canvas"
              className={styles.mainImage}
              onLoad={() => {
                console.log("✅ Image rendered in DOM");
                setImageLoaded(true);
              }}
              onError={(e) => {
                console.error("❌ Image render error:", e);
                setImageError(true);
              }}
              style={{
                opacity: imageLoaded ? 1 : 0,
                transition: "opacity 0.3s ease",
                width: "100%",
                maxWidth: "500px",
                display: "block",
                margin: "0 auto",
              }}
            />
          )}

          {product && imageLoaded && (
            <>
              {isEditing ? (
                <textarea
                  ref={inputRef}
                  className={`${styles.presetText} ${styles.editInput}`}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  style={dynamicStyles}
                  onBlur={handleBlur}
                  inputMode="text"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  data-gramm="false"
                  data-gramm_editor="false"
                  data-enable-grammarly="false"
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
              )}
            </>
          )}

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

ShirtEditor.displayName = "ShirtEditor";

export default ShirtEditor;
