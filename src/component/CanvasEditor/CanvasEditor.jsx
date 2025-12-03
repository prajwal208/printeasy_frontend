"use client";
import React, { useEffect, useRef, useState } from "react";
import { ChevronLeft, ShoppingBag, Heart, Share2 } from "lucide-react";
import styles from "./canvas.module.scss";
import { COLORS, fontMap, FONTS, SIZES } from "@/constants";
import { useRouter } from "next/navigation";
import bag from "../../assessts/bag.svg";
import share from "../../assessts/share.svg";
import Image from "next/image";

export default function CanvasEditor({
  product,
  setPrintingImg,
  addToWishlist,
}) {
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const activeTextRef = useRef(null);
  const scriptRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedFont, setSelectedFont] = useState("Arial");
  const [selectedColor, setSelectedColor] = useState("#000000");
  const [selectedSize, setSelectedSize] = useState(28);
  const [activeTab, setActiveTab] = useState("font");
  const [isWishlisted, setIsWishlisted] = useState(product?.isInWishlist);
  const [fonts, setFonts] = useState([]);
  const router = useRouter();
  const count = localStorage.getItem("count");

  const loadFont = async (fontName) => {
    if (!fontName) return;

    // Use fontMap to match correct system name if needed
    const fileName = fontMap[fontName] || fontName;

    const font = new FontFace(
      fileName,
      `url(/fonts/${fileName}.ttf)` // <-- Local font loading
    );

    try {
      await font.load();
      document.fonts.add(font);
    } catch (e) {
      console.warn("Local font failed loading:", fileName, e);
    }
  };

  useEffect(() => {
    const fetchFonts = async () => {
      const res = await fetch("/api/fonts");
      const data = await res.json();

      data.forEach((font) => loadFont(font));

      setFonts(data);
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
    s.onload = () => initCanvas();
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

  const initCanvas = () => {
    disposeCanvas();
    const canvas = new window.fabric.Canvas(canvasRef.current, {
      width: 600,
      height: 700,
      backgroundColor: "#f0f0f0",
      preserveObjectStacking: true,
      selection: true,
    });

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
      const t = opt.target;
      if (t && t.type === "textbox") {
        canvas.setActiveObject(t);
        handleSelection({ selected: [t] });
      } else {
        startTextEditing();
      }
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

        shirtImg.set({
          scaleX: scale,
          scaleY: scale,
          top: 100,
          left: 100,
        });

        canvas.setBackgroundImage(shirtImg, () => {
          canvas.renderAll();
          addTextBelowIllustration(canvas, null);
        });
      },
      { crossOrigin: "anonymous" }
    );
  };

  useEffect(() => {
    Object.values(fontMap).forEach((font) => {
      loadFont(font);
    });
  }, []);

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
      : (SAFE.top + SAFE.height / 2 - selectedSize / 2) + 65;

    const fontName =
      fontMap[product?.fontFamily] || product?.fontFamily || selectedFont;

    await document.fonts.load(`16px ${fontName}`);
    await loadFont(fontName);

    const text = new window.fabric.Textbox(
      product?.presetText || "YOUR TEXT HERE",
      {
        left: SAFE.left + 30,
        top: topPos,
        width: SAFE.width - 10,
        fontSize: defaultFontSize,
        fontFamily: defaultFontFamily,
        fill: defaultFontColor,
        textAlign: "center",
        fontWeight: "normal",
        splitByGrapheme: true,
        editable: true,
        lockMovementX: true,
        lockMovementY: true,
        hasControls: false,
        hasBorders: false,
        selectable: true,
      }
    );

    setPrintingImg({
      textColor: text.fill,
      fontFamily: text.fontFamily,
      printText: text.text,
      fontSize: text.fontSize,
    });

    text.on("selected", () => {
      activeTextRef.current = text;
      setSelectedFont(text.fontFamily || "Arial");
      setSelectedColor(text.fill || "#000");
      setSelectedSize(text.fontSize || 28);
      setIsEditing(!!text.isEditing);
    });

    text.on("editing:entered", () => {
      try {
        const ta = text.hiddenTextarea;
        if (ta) {
          ta.style.fontFamily = text.fontFamily || "Arial";
          ta.style.color = text.fill || "#000";
          ta.style.fontSize = (text.fontSize || 28) + "px";
        }
      } catch (e) {}
      activeTextRef.current = text;
      setIsEditing(true);
    });

    text.on("editing:exited", () => setIsEditing(false));

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
    canvas.requestRenderAll();
  };

  const startTextEditing = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const textObj = canvas.getObjects().find((o) => o.type === "textbox");
    if (!textObj) return;

    canvas.setActiveObject(textObj);
    textObj.enterEditing();
    canvas.requestRenderAll();

    activeTextRef.current = textObj;
    setIsEditing(true);
    setSelectedFont(textObj.fontFamily || "Arial");
    setSelectedColor(textObj.fill || "#000");
    setSelectedSize(textObj.fontSize || 28);
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

  const onFontSelect = async (fontName) => {
    const mapped = fontMap[fontName] || fontName;

    await loadFont(mapped);
    setSelectedFont(mapped);
    applyToActiveText({ fontFamily: mapped });
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
      if (res?.status === 200) {
        setIsWishlisted(true);
      }
    } catch (err) {
      console.log("Failed to add wishlist:", err);
    }
  };

  return (
    <div className={styles.editorWrapper}>
      <div className={styles.back} onClick={() => router.back()}>
        <ChevronLeft size={30} />
      </div>
      <div className={styles.mobileIconsContainer}>
        <div className={styles.mobileIconsRight}>
          <button className={styles.mobileIcon} onClick={() => {}}>
            {count > "0" && <span className={styles.badge}>{count}</span>}
            <Image src={bag} />
          </button>
          <button className={styles.mobileIcon} onClick={handleWishlistClick}>
            <Heart
              size={40}
              stroke={isWishlisted ? "red" : "black"}
              fill={isWishlisted ? "red" : "transparent"}
            />
          </button>
          <button className={styles.mobileIcon} onClick={handleShare}>
            <Image src={share} />
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
            <span className={styles.iconAa}>Aa</span>
            <span className={styles.toolLabel}>Font Size</span>
          </button>

          <button
            onClick={() => setActiveTab(activeTab === "color" ? null : "color")}
            className={`${styles.toolButton} ${
              activeTab === "color" ? styles.activeTool : ""
            }`}
          >
            <span className={styles.iconColorA}>A</span>
            <span className={styles.toolLabel}>Colour</span>
          </button>

          <button
            onClick={() => setActiveTab(activeTab === "font" ? null : "font")}
            className={`${styles.toolButton} ${
              activeTab === "font" ? styles.activeTool : ""
            }`}
          >
            <span className={styles.iconF}>f</span>
            <span className={styles.toolLabel}>Fonts</span>
          </button>

          <div className={styles.toolButton}>
            <span className={styles.iconKeyboard}>⌨</span>
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
                {fonts.map((fontName) => {
                  const isActive = selectedFont === fontName;

                  return (
                    <React.Fragment key={fontName}>
                      <button
                        onClick={() => onFontSelect(fontName)}
                        className={`${styles.fontOption} ${
                          isActive ? styles.active : ""
                        }`}
                        style={{ fontFamily: fontName }} // <-- Fix: no quotes needed
                      >
                        {fontName}
                      </button>

                      <div style={{ border: "1px solid #b3a99b" }}></div>
                    </React.Fragment>
                  );
                })}
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
