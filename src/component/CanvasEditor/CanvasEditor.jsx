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
  }, [product]);

  const disposeCanvas = () => {
    try {
      fabricCanvasRef.current?.dispose();
    } catch (e) {}
    fabricCanvasRef.current = null;
    activeTextRef.current = null;
  };

  const focusTextarea = (textObj) => {
    try {
      const ta = textObj.hiddenTextarea;
      if (!ta) return;
      requestAnimationFrame(() => {
        ta.focus({ preventScroll: true });
        ta.setSelectionRange(ta.value.length, ta.value.length);
      });
    } catch (e) {
      console.log("Textarea focus failed", e);
    }
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

    canvas.on("mouse:down", (opt) => {
      const target = opt.target;
      if (target && target.type === "textbox") {
        canvas.setActiveObject(target);
        activeTextRef.current = target;
        setSelectedFont(target.fontFamily || "Arial");
        setSelectedColor(target.fill || "#000");
        setSelectedSize(target.fontSize || 28);

        setTimeout(() => {
          target.enterEditing();
          focusTextarea(target);
          setIsEditing(true);
          canvas.requestRenderAll();
        }, 50);
        return;
      }
      canvas.discardActiveObject();
      canvas.renderAll();
      activeTextRef.current = null;
      setIsEditing(false);
    });

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
          const tempCanvas = document.createElement("canvas");
          tempCanvas.width = shirtImg.width;
          tempCanvas.height = shirtImg.height;
          const ctx = tempCanvas.getContext("2d");
          ctx.drawImage(shirtImg._element, 0, 0);
          const pixelData = ctx.getImageData(0, 0, 1, 1).data;
          const bgColor = `rgb(${pixelData[0]}, ${pixelData[1]}, ${pixelData[2]})`;
          setCanvasBackground(bgColor);
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
      : SAFE.top + SAFE.height / 2 - selectedSize / 2 + 110;

    const fontName =
      fontMap[product?.fontFamily] || product?.fontFamily || selectedFont;
    const fontData = fonts.find((f) => f.family === fontName);

    if (fontData) {
      await loadFont(fontData);
      await document.fonts.ready;
    }

    const MAX_LINES = 2;
    const MAX_CHARS_PER_LINE = 24;

    const truncateText = (text) => {
      const lines = text.split("\n");
      const processedLines = lines.slice(0, MAX_LINES).map((line) => {
        if (line.length > MAX_CHARS_PER_LINE) {
          return line.substring(0, MAX_CHARS_PER_LINE - 1);
        }
        return line;
      });

      // If more than 2 lines, keep only first 2 and add … on last line if needed
      let result = processedLines.slice(0, MAX_LINES);
      if (lines.length > MAX_LINES && result.length === MAX_LINES) {
        const lastLine = result[MAX_LINES - 1];
        if (lastLine.length >= MAX_CHARS_PER_LINE) {
          result[MAX_LINES - 1] =
            lastLine.substring(0, MAX_CHARS_PER_LINE - 2) + "…";
        } else if (lastLine.length < MAX_CHARS_PER_LINE) {
          result[MAX_LINES - 1] =
            lastLine.padEnd(MAX_CHARS_PER_LINE - 1, " ") + "…";
        }
      }

      return result.join("\n");
    };

    const text = new window.fabric.Textbox(
      product?.presetText || "YOUR TEXT HERE",
      {
        left: SAFE.left + 50,
        top: topPos,
        width: SAFE.width - 40,
        fontSize: defaultFontSize,
        fontFamily: defaultFontFamily,
        fill: defaultFontColor,
        textAlign: "center",
        fontWeight: "normal",
        lineHeight: 1.2,
        splitByGrapheme: true,
        editable: true,
        lockMovementX: true,
        lockMovementY: true,
        hasControls: false,
        hasBorders: false,
        selectable: true,
      }
    );

    // Main enforcement on text change
    const enforceLimits = () => {
      if (!text.text || text.text === text._text) return;

      const newText = truncateText(text.text);
      if (newText !== text.text) {
        // Store selection to restore cursor position
        const selection = text.selectionStart;
        text.set("text", newText);
        canvas.renderAll();

        // Try to restore cursor position (best effort)
        requestAnimationFrame(() => {
          text.selectionStart = text.selectionEnd = Math.min(
            selection,
            newText.length
          );
          text.enterEditing();
          text.setSelectionStartEnd(text.selectionStart, text.selectionEnd);
        });
      }
    };

    text.on("changed", enforceLimits);
    text.on("editing:entered", () => {
      // Initial enforcement when user starts typing
      enforceLimits();
    });

    // Sync printing data
    const syncPrinting = () =>
      setPrintingImg({
        textColor: text.fill,
        fontFamily: text.fontFamily,
        printText: text.text,
        fontSize: text.fontSize,
      });

    text.on("modified", syncPrinting);
    text.on("changed", syncPrinting);

    canvas.add(text);
    canvas.setActiveObject(text);
    text.enterEditing();
    canvas.requestRenderAll();
  };

  const startTextEditing = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const textObj =
      activeTextRef.current ||
      canvas.getObjects().find((o) => o.type === "textbox");
    if (!textObj) return;

    canvas.setActiveObject(textObj);
    setTimeout(() => {
      textObj.enterEditing();
      focusTextarea(textObj);
      canvas.requestRenderAll();
      activeTextRef.current = textObj;
      setIsEditing(true);
    }, 50);
  };

  const applyToActiveText = (props) => {
    const canvas = fabricCanvasRef.current;
    const obj =
      activeTextRef.current ||
      canvas?.getObjects().find((o) => o.type === "textbox");
    if (!obj) return;
    obj.set(props);
    canvas?.requestRenderAll();
    try {
      const ta = obj.hiddenTextarea;
      if (ta) {
        if (props.fontFamily) ta.style.fontFamily = props.fontFamily;
        if (props.fill) ta.style.color = props.fill;
        if (props.fontSize) ta.style.fontSize = props.fontSize + "px";
      }
    } catch (e) {}
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

      // Keyboard opened (height decreases sharply)
      if (prevHeight.current - currentHeight > 150) {
        const scrollAmount = window.innerHeight * 0.8; // 8%
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
