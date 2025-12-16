"use client";
import React, { useEffect, useRef, useState } from "react";
import { ChevronLeft, Heart } from "lucide-react";
import styles from "./canvas.module.scss";
import { COLORS, fontMap, FONTS, SIZES } from "@/constants";
import { useRouter } from "next/navigation";
import bag from "../../assessts/bag.svg";
import share from "../../assessts/share.svg";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import api from "@/axiosInstance/axiosInstance";
import font from "../../assessts/font.svg";
import letter from "../../assessts/letter1.svg";
import family from "../../assessts/family.svg";
import keyboard from "../../assessts/keyboard.svg";
import line from "../../assessts/Line.svg";

export default function CanvasEditor({
  product,
  setPrintingImg,
  addToWishlist,
}) {
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const activeTextRef = useRef(null);
  const scriptRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedFont, setSelectedFont] = useState("Arial");
  const [selectedColor, setSelectedColor] = useState("#000000");
  const [selectedSize, setSelectedSize] = useState(28);
  const [activeTab, setActiveTab] = useState("font");
  const [isWishlisted, setIsWishlisted] = useState(product?.isInWishlist);
  const [fonts, setFonts] = useState([]);
  const [canvasbackground, setCanvasBackground] = useState("");
  const router = useRouter();
  const { cartCount } = useCart();
  const loadedFonts = new Set();

  // Fixed container dimensions
  const CONTAINER_WIDTH = 175;
  const CONTAINER_HEIGHT = 65;

  const loadFont = async (font) => {
    if (!font) return;
    const family = typeof font === "string" ? font : font.family;
    if (!family || !font.downloadUrl) return;
    if (loadedFonts.has(family)) return;

    try {
      const fontFace = new FontFace(
        family,
        `url(${font.downloadUrl}) format("truetype")`
      );
      await fontFace.load();
      document.fonts.add(fontFace);
      loadedFonts.add(family);
      console.log(`Font Loaded: ${family}`);
    } catch (err) {
      console.error(`Font failed to load: ${family}`, err);
    }
  };

  useEffect(() => {
    const fetchFonts = async () => {
      try {
        const res = await api.get("/v2/font?activeOnly=true", {
          headers: {
            "x-api-key":
              "454ccaf106998a71760f6729e7f9edaf1df17055b297b3008ff8b65a5efd7c10",
          },
        });
        setFonts(res?.data?.data);
      } catch (err) {
        console.error("Font fetch error:", err);
      }
    };
    fetchFonts();
  }, []);

  const defaultFontSize = product?.fontSize || selectedSize;
  const defaultFontFamily =
    fontMap[product?.fontFamily] || product?.fontFamily || selectedFont;
  const defaultFontColor = product?.fontColor || selectedColor;

  const SAFE = { left: 170, top: 260, width: 220, height: 180 };

  const getRealImageUrl = (img) => {
    if (!img) return null;
    if (typeof img === "object" && img.src) return img.src;
    try {
      if (img.startsWith("/_next/image")) {
        const url = new URL(img, window.location.origin);
        const real = url.searchParams.get("url");
        return real ? decodeURIComponent(real) : img;
      }
    } catch (error) {
      console.log(error);
    }
    return img;
  };

  // Add this inside your component
useEffect(() => {
  const shirtUrl = getRealImageUrl(product?.canvasImage);
  if (shirtUrl) {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = shirtUrl;
    document.head.appendChild(link);
  }
}, [product?.canvasImage]);

  useEffect(() => {
    if (window.fabric) {
      initCanvas();
      return () => disposeCanvas();
    }
    const s = document.createElement("script");
    s.src =
      "https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.1/fabric.min.js";
    s.async = true;
    s.onload = initCanvas;
    document.body.appendChild(s);
    scriptRef.current = s;

    return () => {
      disposeCanvas();
      if (scriptRef.current) document.body.removeChild(scriptRef.current);
    };
  }, []);

  const disposeCanvas = () => {
    try {
      fabricCanvasRef.current?.dispose();
    } catch (e) {}
    fabricCanvasRef.current = null;
    activeTextRef.current = null;
  };

  // Detect iOS device
  const isIOS = () => {
    return (
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
    );
  };

  const focusTextarea = (textObj) => {
    const ta = textObj.hiddenTextarea;
    if (!ta) return;

    requestAnimationFrame(() => {
      ta.focus({ preventScroll: true });

      const len = ta.value.length;
      try {
        ta.setSelectionRange(len, len);
      } catch (e) {}

      // Ensure Fabric cursor syncs
      textObj.selectionStart = len;
      textObj.selectionEnd = len;
      textObj._updateTextarea();
    });
  };

  const initCanvas = () => {
    disposeCanvas();
    const canvas = new window.fabric.Canvas(canvasRef.current, {
      width: 600,
      height: 700,
      backgroundColor: "#fff",
      preserveObjectStacking: true,
      selection: true,
    });
    canvas.setBackgroundColor(canvasbackground, canvas.renderAll.bind(canvas));
    fabricCanvasRef.current = canvas;

    const handleSelection = (e) => {
      const obj = (e.selected && e.selected[0]) || e.target;
      if (obj && obj.type === "textbox") {
        activeTextRef.current = obj;
        setIsEditing(!!obj.isEditing);
        setSelectedFont(obj.fontFamily || "Arial");
        setSelectedColor(obj.fill || "#000");
        setSelectedSize(obj.fontSize || 28);
      }
    };

    const clearSelection = () => {
      activeTextRef.current = null;
      setIsEditing(false);
    };

    canvas.on("selection:created", handleSelection);
    canvas.on("selection:updated", handleSelection);
    canvas.on("selection:cleared", clearSelection);

    const handleTextSelection = (target) => {
      if (!target || target.type !== "textbox") return;

      canvas.setActiveObject(target);
      activeTextRef.current = target;
      setSelectedFont(target.fontFamily || "Arial");
      setSelectedColor(target.fill || "#000");
      setSelectedSize(target.fontSize || 28);

      if (isIOS()) {
        target.enterEditing();
        focusTextarea(target);
        setIsEditing(true);
        canvas.requestRenderAll();
      } else {
        setTimeout(() => {
          target.enterEditing();
          focusTextarea(target);
          setIsEditing(true);
          canvas.requestRenderAll();
        }, 50);
      }
    };

    canvas.on("mouse:down", (opt) => {
      const target = opt.target;
      if (target && target.type === "textbox") {
        handleTextSelection(target);
        return;
      }
      canvas.discardActiveObject();
      canvas.renderAll();
      activeTextRef.current = null;
      setIsEditing(false);
    });

    if (isIOS()) {
      canvas.on("touch:start", (opt) => {
        const target = opt.target;
        if (target && target.type === "textbox") {
          handleTextSelection(target);
          return;
        }
        canvas.discardActiveObject();
        canvas.renderAll();
        activeTextRef.current = null;
        setIsEditing(false);
      });
    }

    loadProductImages(canvas);
  };

  const loadProductImages = (canvas) => {
    const shirtUrl = getRealImageUrl(product?.canvasImage);
    if (!shirtUrl) return;
    
    window.fabric.Image.fromURL(
      shirtUrl,
      (shirtImg) => {
        if (!shirtImg.width) return;
        const scale = (canvas.width / shirtImg.width) * 0.68;
        shirtImg.set({ scaleX: scale, scaleY: scale, top: 125, left: 100 });
        canvas.setBackgroundImage(shirtImg, () => {
          canvas.renderAll();
          addTextBelowIllustration(canvas, null);
        });
      },
      { crossOrigin: "anonymous" }
    );
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.title || "Check this out!",
          text: "Look at this product:",
          url: shareUrl,
        });
      } catch (error) {
        console.log("Share cancelled", error);
      }
    } else {
      window.open(
        `https://wa.me/?text=${encodeURIComponent(shareUrl)}`,
        "_blank"
      );
    }
  };

  const addTextBelowIllustration = async (canvas, illustration) => {
    const topPos = illustration
      ? illustration.top + illustration.getScaledHeight() + 10
      : SAFE.top + SAFE.height / 2 - 75;

    const fontName =
      fontMap[product?.fontFamily] || product?.fontFamily || selectedFont;
    const fontData = fonts.find((f) => f.family === fontName);

    if (fontData) {
      await loadFont(fontData);
      await document.fonts.ready;
    }

    const forceSmartWrap = () => {
      const ctx = canvas.getContext();
      ctx.font = `${text.fontSize}px ${text.fontFamily}`;

      const maxWidth = CONTAINER_WIDTH - 16;
      const lines = text.text.split("\n");
      let result = [];
      let cursorShift = 0;

      lines.forEach((line) => {
        let words = line.split(" ");
        let currentLine = "";

        words.forEach((word, index) => {
          const testLine =
            currentLine.length === 0 ? word : currentLine + " " + word;

          const width = ctx.measureText(testLine).width;

          // ✅ Word fits → keep going
          if (width <= maxWidth) {
            currentLine = testLine;
            return;
          }

          // ✅ Word does NOT fit, but line has content → move word to next line
          if (ctx.measureText(word).width <= maxWidth) {
            result.push(currentLine);
            currentLine = word;
            return;
          }

          // ❌ Single word too long → break by character
          let chunk = "";
          for (let char of word) {
            const testChunk = chunk + char;
            if (ctx.measureText(testChunk).width > maxWidth) {
              result.push(chunk);
              chunk = char;
            } else {
              chunk = testChunk;
            }
          }

          currentLine = chunk;
        });

        result.push(currentLine);
      });

      const newText = result.join("\n");

      if (newText !== text.text) {
        const cursorPos = text.selectionStart;
        text.text = newText;
        text.selectionStart = cursorPos + cursorShift;
        text.selectionEnd = text.selectionStart;
      }
    };

    const PLACEHOLDER_TEXT = "YOUR TEXT HERE";

    const text = new window.fabric.Textbox(
      product?.presetText || PLACEHOLDER_TEXT,
      {
        left: SAFE.left + 24 + (SAFE.width - CONTAINER_WIDTH) / 2,
        top: topPos + 150,
        width: CONTAINER_WIDTH,
        fontSize: defaultFontSize,
        fontFamily: defaultFontFamily,
        fill: product?.presetText ? defaultFontColor : "#999",
        textAlign: "center",
        fontWeight: "normal",
        lineHeight: 1,
        splitByGrapheme: false,
        breakWords: true,
        editable: true,
        lockMovementX: true,
        lockMovementY: true,
        lockScalingX: true,
        lockScalingY: true,
        hasControls: false,
        hasBorders: false,
        borderColor: "transparent",
        selectable: true,
        dynamicMinWidth: CONTAINER_WIDTH,
        minWidth: CONTAINER_WIDTH,
        lockUniScaling: true,
      }
    );

    // ================================
    // Placeholder state
    // ================================
    text.__placeholder = PLACEHOLDER_TEXT;
    text.__isPlaceholder = !product?.presetText;

    // ================================
    // Scroll state
    // ================================
    let scrollOffset = 0;

    // ================================
    // Lock dimensions
    // ================================
    const lockDimensions = () => {
      Object.defineProperty(text, "width", {
        get: () => CONTAINER_WIDTH,
        set: () => {},
        configurable: true,
      });

      Object.defineProperty(text, "height", {
        get: () => CONTAINER_HEIGHT,
        set: () => {},
        configurable: true,
      });
    };

    lockDimensions();

    // ================================
    // Override wrap & render
    // ================================
    const originalWrapText = text._wrapText;
    text._wrapText = function (lines, desiredWidth) {
      const result = originalWrapText.call(this, lines, desiredWidth);
      this._textLines = result;
      return result;
    };

    const originalRenderText = text._renderText;
    text._renderText = function (ctx) {
      ctx.save();
      ctx.translate(0, -scrollOffset);
      originalRenderText.call(this, ctx);
      ctx.restore();
    };

    const originalRender = text._render;
    text._render = function (ctx) {
      this.width = CONTAINER_WIDTH;
      this.height = CONTAINER_HEIGHT;

      ctx.save();
      ctx.beginPath();
      ctx.rect(
        -CONTAINER_WIDTH / 2,
        -CONTAINER_HEIGHT / 2,
        CONTAINER_WIDTH,
        CONTAINER_HEIGHT
      );
      ctx.clip();

      originalRender.call(this, ctx);
      ctx.restore();
    };

    // ================================
    // Textarea styling
    // ================================
    const styleTextarea = () => {
      const ta = text.hiddenTextarea;
      if (!ta) return;

      ta.style.position = "fixed";
      ta.style.width = `${CONTAINER_WIDTH}px`;
      ta.style.height = `${CONTAINER_HEIGHT}px`;
      ta.style.overflowY = "scroll";
      ta.style.overflowX = "hidden";
      ta.style.whiteSpace = "pre-wrap";
      ta.style.wordBreak = "break-word";
      ta.style.boxSizing = "border-box";
      ta.style.padding = "8px";
      ta.style.resize = "none";
      ta.style.border = "1px solid #ddd";
      ta.style.borderRadius = "4px";
      ta.style.background = "rgba(255,255,255,0.95)";
      ta.style.zIndex = "10000";
      ta.style.fontFamily = text.fontFamily;
      ta.style.fontSize = text.fontSize + "px";
      ta.style.color = text.fill;
      ta.style.textAlign = text.textAlign;
      ta.style.lineHeight = text.lineHeight;

      if (isIOS()) {
        ta.style.webkitOverflowScrolling = "touch";
        ta.style.transform = "translate3d(0,0,0)";
      }

      const canvasRect = canvasRef.current.getBoundingClientRect();
      const zoom = canvas.getZoom();
      ta.style.left = `${text.left * zoom + canvasRect.left}px`;
      ta.style.top = `${text.top * zoom + canvasRect.top}px`;
    };

    const moveCursorToEnd = () => {
      const ta = text.hiddenTextarea;
      if (!ta) return;

      const len = ta.value.length;

      try {
        ta.focus({ preventScroll: true });
        ta.setSelectionRange(len, len);
      } catch (e) {}

      // 🔥 Fabric internal sync
      text.selectionStart = len;
      text.selectionEnd = len;
      text._updateTextarea();
    };

    // ================================
    // Scroll logic (extra upward)
    // ================================
    const updateScrollToCursor = () => {
      const LINE_HEIGHT = text.fontSize * text.lineHeight;
      const PADDING_TOP = 8;

      const visibleHeight = CONTAINER_HEIGHT - PADDING_TOP * 2;
      const VISIBLE_LINES = Math.floor(visibleHeight / LINE_HEIGHT);

      const maxWidth = CONTAINER_WIDTH - 16; // padding
      const lines = text._textLines || [];

      const totalLines = lines.length;

      // ✅ If text fits → no scroll
      if (totalLines <= VISIBLE_LINES) {
        scrollOffset = 0;
        return;
      }

      // 🔥 CHECK IF LAST VISIBLE LINE IS ACTUALLY FULL
      const ctx = fabricCanvasRef.current.getContext();
      ctx.font = `${text.fontSize}px ${text.fontFamily}`;

      const lastVisibleLine = lines[VISIBLE_LINES - 1].join("");
      const lastLineWidth = ctx.measureText(lastVisibleLine).width;

      // ❌ Don't scroll until width is FULL
      if (lastLineWidth < maxWidth - 2) {
        scrollOffset = 0;
        return;
      }

      // ✅ Scroll by exactly one line
      const hiddenLines = totalLines - VISIBLE_LINES;
      scrollOffset = hiddenLines * LINE_HEIGHT;
    };

    const handleTextChange = () => {
      if (text.text.trim() === "") {
        text.__isPlaceholder = true;
        text.set({ text: text.__placeholder, fill: "#999" });
        scrollOffset = 0;
        canvas.requestRenderAll();
        styleTextarea();
        moveCursorToEnd();
        return;
      }

      if (text.__isPlaceholder) {
        text.__isPlaceholder = false;
        text.set({ fill: defaultFontColor });
      }

      // 🔥 Correct wrapping
      forceSmartWrap();

      // 🔥 Update scroll AFTER wrap
      updateScrollToCursor();

      text._clearCache();
      lockDimensions();
      canvas.requestRenderAll();
      styleTextarea();

      requestAnimationFrame(moveCursorToEnd);
    };

    text.on("changed", handleTextChange);
    text.on("modified", handleTextChange);

    text.on("editing:entered", () => {
      styleTextarea();

      setTimeout(() => {
        const ta = text.hiddenTextarea;
        if (!ta) return;

        if (text.__isPlaceholder) {
          ta.value = "";
          ta.setSelectionRange(0, 0);
        } else {
          const len = ta.value.length;
          ta.focus();
          ta.setSelectionRange(len, len);
        }
        moveCursorToEnd();
        updateScrollToCursor();
        canvas.requestRenderAll();
      }, 20);
    });

    // ================================
    // Add to canvas
    // ================================
    canvas.add(text);
    canvas.setActiveObject(text);

    setTimeout(
      () => {
        text.enterEditing();
        styleTextarea();
        canvas.requestRenderAll();
      },
      isIOS() ? 100 : 30
    );
  };

  const startTextEditing = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const textObj =
      activeTextRef.current ||
      canvas.getObjects().find((o) => o.type === "textbox");
    if (!textObj) return;

    textObj.set({
      width: CONTAINER_WIDTH,
      height: CONTAINER_HEIGHT,
    });

    canvas.setActiveObject(textObj);

    const styleAndFocus = () => {
      const ta = textObj.hiddenTextarea;
      if (ta) {
        ta.style.width = `${CONTAINER_WIDTH}px`;
        ta.style.height = `${CONTAINER_HEIGHT}px`;
        ta.style.maxHeight = `${CONTAINER_HEIGHT}px`;
        ta.style.overflowY = "scroll";
        ta.style.overflowX = "hidden";
        ta.style.position = "fixed";
        ta.style.boxSizing = "border-box";
        ta.style.padding = "0px";
        ta.style.resize = "none";

        if (isIOS()) {
          ta.style.webkitOverflowScrolling = "touch";
        }

        const canvasRect = canvasRef.current.getBoundingClientRect();
        const zoom = canvas.getZoom();
        ta.style.left = `${textObj.left * zoom + canvasRect.left}px`;
        ta.style.top = `${textObj.top * zoom + canvasRect.top}px`;
      }
      focusTextarea(textObj);
    };

    if (isIOS()) {
      textObj.enterEditing();
      styleAndFocus();
      canvas.requestRenderAll();
      activeTextRef.current = textObj;
      setIsEditing(true);
    } else {
      setTimeout(() => {
        textObj.enterEditing();
        styleAndFocus();
        canvas.requestRenderAll();
        activeTextRef.current = textObj;
        setIsEditing(true);
      }, 50);
    }
  };

  const applyToActiveText = (props) => {
    const canvas = fabricCanvasRef.current;
    const obj =
      activeTextRef.current ||
      canvas?.getObjects().find((o) => o.type === "textbox");
    if (!obj) return;

    obj.set({
      ...props,
      width: CONTAINER_WIDTH,
      height: CONTAINER_HEIGHT,
    });

    canvas?.requestRenderAll();

    try {
      const ta = obj.hiddenTextarea;
      if (ta) {
        ta.style.width = `${CONTAINER_WIDTH}px`;
        ta.style.height = `${CONTAINER_HEIGHT}px`;
        ta.style.maxHeight = `${CONTAINER_HEIGHT}px`;
        ta.style.minHeight = `${CONTAINER_HEIGHT}px`;
        ta.style.overflowY = "scroll";
        ta.style.overflowX = "hidden";
        ta.style.boxSizing = "border-box";
        ta.style.padding = "0px";
        ta.style.resize = "none";

        if (props.fontFamily) ta.style.fontFamily = props.fontFamily;
        if (props.fill) ta.style.color = props.fill;
        if (props.fontSize) ta.style.fontSize = props.fontSize + "px";

        if (isIOS()) {
          ta.style.webkitOverflowScrolling = "touch";
          ta.style.transform = "translate3d(0,0,0)";
        }
      }
    } catch (e) {
      console.log("Textarea update failed", e);
    }

    setPrintingImg({
      textColor: obj.fill,
      fontFamily: obj.fontFamily,
      printText: obj.text,
      fontSize: obj.fontSize,
    });
  };

  const onFontSelect = async (fontObj) => {
    await loadFont(fontObj);
    setSelectedFont(fontObj.family);
    applyToActiveText({ fontFamily: fontObj.family });
  };

  const onColorSelect = (c) => {
    setSelectedColor(c);
    applyToActiveText({ fill: c });
  };

  const onSizeSelect = (s) => {
    setSelectedSize(s);
    applyToActiveText({ fontSize: s });
  };

  const handleWishlistClick = async () => {
    try {
      const res = await addToWishlist();
      if (res?.status === 200) setIsWishlisted(true);
    } catch (err) {
      console.log("Failed to add wishlist:", err);
    }
  };

  useEffect(() => {
    fonts.forEach(async (font) => {
      if (!loadedFonts.has(font.family)) {
        await loadFont(font);
        await document.fonts.load(`16px ${font.family}`);
        loadedFonts.add(font.family);
      }
    });
  }, [fonts]);

  const prevHeight = useRef(window.innerHeight);

  useEffect(() => {
    const handleResize = () => {
      const currentHeight = window.innerHeight;

      if (prevHeight.current - currentHeight > 150) {
        const scrollAmount = window.innerHeight * 0.8;
        window.scrollBy({ top: scrollAmount, behavior: "smooth" });
      }

      prevHeight.current = currentHeight;
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className={styles.editorWrapper}>
      <div className={styles.back} onClick={() => router.back()}>
        <ChevronLeft size={30} />
      </div>
      <div className={styles.mobileIconsContainer}>
        <div className={styles.mobileIconsRight}>
          <button
            className={styles.mobileIcon}
            onClick={() => router.push("/cart")}
          >
            {cartCount > "0" && (
              <span className={styles.badge}>{cartCount}</span>
            )}
            <Image src={bag} alt="bag" />
          </button>
          <button className={styles.mobileIcon} onClick={handleWishlistClick}>
            <Heart
              size={40}
              stroke={isWishlisted ? "red" : "black"}
              fill={isWishlisted ? "red" : "transparent"}
            />
          </button>
          <button className={styles.mobileIcon} onClick={handleShare}>
            <Image src={share} alt="share" />
          </button>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={600}
        height={700}
        className={styles.canvas}
      />

      {isEditing && (
        <div className={styles.floatingToolbar}>
          <button
            onClick={() => setActiveTab(activeTab === "size" ? null : "size")}
            className={`${styles.toolButton} ${
              activeTab === "size" ? styles.activeTool : ""
            }`}
          >
            <Image src={letter} alt="font" />
            <span className={styles.toolLabel}>Font Size</span>
          </button>

          <button
            onClick={() => setActiveTab(activeTab === "color" ? null : "color")}
            className={`${styles.toolButton} ${
              activeTab === "color" ? styles.activeTool : ""
            }`}
          >
            <Image src={font} alt="font" />
            <span className={styles.toolLabel}>Colour</span>
          </button>

          <button
            onClick={() => setActiveTab(activeTab === "font" ? null : "font")}
            className={`${styles.toolButton} ${
              activeTab === "font" ? styles.activeTool : ""
            }`}
          >
            <Image src={family} alt="font" />
            <span className={styles.toolLabel}>Fonts</span>
          </button>

          <div className={styles.toolButton} onClick={startTextEditing}>
            <Image src={keyboard} alt="font" />
            <span className={styles.toolLabel}>Edit</span>
          </div>

          <button
            onClick={() => setIsEditing(false)}
            className={styles.closeToolbarBtn}
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
                    <Image src={line} alt="line" />
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
  );
}
