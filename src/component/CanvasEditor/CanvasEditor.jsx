"use client";
import React, { useEffect, useRef, useState } from "react";
import styles from "./canvas.module.scss";

const SAFE = { left: 140, top: 260, width: 260, height: 180 };

const FONTS = [
  "Meanwhile",
  "MONKEY",
  "MORELOVE",
  "PINK ROSE",
  "RAINBOWDREAMS",
  "REALITY",
  "SCRIBBLE",
  "SOMEKIND",
  "SQUISHY",
  "Summershine",
  "Sunshine",
  "SweetDreams",
  "TheWildOne",
  "TheWildOneFun",
  "TheWildOneSolid",
  "Asteroid",
  "BeachBikini",
  "Beachside",
  "BeachSunrise",
  "BlueberryMuffin",
  "Cakepop",
  "California",
  "DearMay",
  "Firefly",
  "Forever",
  "FreshLemonade",
  "Frozen",
  "Hathway",
  "HeySugar",
  "Honey",
  "Honeycomb",
  "However",
  "IceCream",
  "Jade Skies",
  "Joyful",
  "Love Hearts",
  "Love More",
  "Love Vibes",
  "LoveAndHoney",
  "MapleSugar",
  "Thinker",
  "Thoughtful",
  "TigerLand",
  "Tigerlily",
];

const fontMap = {
  Meanwhile: "Meanwhile",
  MONKEY: "Monkey",
  MORELOVE: "MoreLove",
  "PINK ROSE": "Pink Rose",
  RAINBOWDREAMS: "RainbowDreams",
  REALITY: "Reality",
  SCRIBBLE: "Scramble",
  SOMEKIND: "Somekind",
  SQUISHY: "SourSlushy",
  Summershine: "SummerSunshine",
  Sunshine: "Sunlight",
  SweetDreams: "SweetDreams",
  TheWildOne: "TheWildOne",
  TheWildOneFun: "TheWildOneFun",
  TheWildOneSolid: "TheWildOneSolid",
  Asteroid: "Asteroid",
  BeachBikini: "BeachBikini",
  Beachside: "Beachside",
  BeachSunrise: "BeachSunrise",
  BlueberryMuffin: "BlueberryMuffin",
  Cakepop: "Cakepop",
  California: "California",
  DearMay: "DearMay",
  Firefly: "Firefly",
  Forever: "Forever",
  FreshLemonade: "FreshLemonade",
  Frozen: "Frozen",
  Hathway: "Hathway",
  HeySugar: "HeySugar",
  Honey: "Honey",
  Honeycomb: "Honeycomb",
  However: "However",
  IceCream: "IceCream",
  "Jade Skies": "Jade Skies",
  Joyful: "Joyful",
  "Love Hearts": "Love Hearts",
  "Love More": "Love More",
  "Love Vibes": "Love Vibes",
  LoveAndHoney: "LoveAndHoney",
  MapleSugar: "MapleSugar",
  Thinker: "Thinker",
  Thoughtful: "Thoughtful",
  TigerLand: "TigerLand",
  Tigerlily: "Tigerlily",
};

const COLORS = [
  "#FFFFFF",
  "#000000",
  "#f44336",
  "#e91e63",
  "#9c27b0",
  "#3f51b5",
  "#2196f3",
  "#03a9f4",
  "#00bcd4",
  "#009688",
  "#4caf50",
  "#8bc34a",
  "#cddc39",
  "#ffeb3b",
  "#ffc107",
  "#ff9800",
  "#ff5722",
  "#795548",
  "#607d8b",
  "#ff5252",
  "#ff4081",
  "#e040fb",
  "#7c4dff",
  "#536dfe",
  "#448aff",
  "#40c4ff",
  "#18ffff",
  "#64ffda",
  "#69f0ae",
  "#b2ff59",
  "#eeff41",
  "#ffff00",
  "#ffd740",
  "#ffab40",
  "#ff6e40",
];
const SIZES = [10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 38];

export default function CanvasEditor({ product, setPrintingImg }) {
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const activeTextRef = useRef(null);
  const scriptRef = useRef(null);

  const [isEditing, setIsEditing] = useState(false);
  const [selectedFont, setSelectedFont] = useState("Arial");
  const [selectedColor, setSelectedColor] = useState("#000000");
  const [selectedSize, setSelectedSize] = useState(28);
  const [activeTab, setActiveTab] = useState("font");

  const getRealImageUrl = (img) => {
    if (!img) return null;
    if (typeof img === "object" && img.src) return img.src;
    try {
      if (img.startsWith("/_next/image")) {
        const url = new URL(img, window.location.origin);
        const real = url.searchParams.get("url");
        return real ? decodeURIComponent(real) : img;
      }
    } catch (e) {}
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
      }
    });

    loadProductImages(canvas);
  };

  const loadProductImages = (canvas) => {
    const shirtUrl = getRealImageUrl(product?.canvasImage);
    const illustrationUrl = getRealImageUrl(product?.illustrationImage);

    if (!shirtUrl) return;

    window.fabric.Image.fromURL(
      shirtUrl,
      (shirtImg) => {
        if (!shirtImg.width) return;
        const scale = canvas.width / shirtImg.width;
        shirtImg.set({ scaleX: scale, scaleY: scale, top: 0, left: 0 });
        canvas.setBackgroundImage(shirtImg, () => {
          canvas.renderAll();
          if (illustrationUrl) {
            window.fabric.Image.fromURL(
              illustrationUrl,
              (illuImg) => {
                if (!illuImg.width) return;
                const scaleX = (SAFE.width / illuImg.width) * 1.2;
                const scaleY = (SAFE.height / illuImg.height) * 1.2;
                const scale = Math.min(scaleX, scaleY);
                illuImg.set({
                  left:
                    SAFE.left + (SAFE.width - illuImg.width * scale) / 2 + 30,
                  top:
                    SAFE.top + (SAFE.height - illuImg.height * scale) / 2 + 40,
                  scaleX: scale,
                  scaleY: scale,
                  selectable: false,
                  evented: false,
                });
                canvas.add(illuImg);
                addTextBelowIllustration(canvas, illuImg);
              },
              { crossOrigin: "anonymous" }
            );
          } else {
            addTextBelowIllustration(canvas, null);
          }
        });
      },
      { crossOrigin: "anonymous" }
    );
  };

  const addTextBelowIllustration = (canvas, illustration) => {
    const topPos = illustration
      ? illustration.top + illustration.getScaledHeight() + 10
      : SAFE.top + SAFE.height / 2 - selectedSize / 2;

    const text = new window.fabric.Textbox(
      product?.presetText || "YOUR TEXT HERE",
      {
        left: SAFE.left + 30,
        top: topPos,
        width: SAFE.width,
        fontSize: selectedSize,
        fontFamily: selectedFont,
        fill: selectedColor,
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

  const onFontSelect = (fontName) => {
    const mapped = fontMap[fontName] || fontName;
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

  return (
    <div className={styles.editorWrapper}>
      <canvas
        ref={canvasRef}
        width={600}
        height={700}
        className={styles.canvas}
      />

      {isEditing && (
        <div className={styles.toolbar}>
          <div className={styles.toolbarTabs}>
            <button
              onClick={() => setActiveTab("font")}
              className={`${styles.tabButton} ${
                activeTab === "font" ? styles.active : ""
              }`}
            >
              Font
            </button>
            <button
              onClick={() => setActiveTab("color")}
              className={`${styles.tabButton} ${
                activeTab === "color" ? styles.active : ""
              } ${styles.colorTab}`}
            >
              <span
                className={styles.colorPreview}
                style={{ backgroundColor: selectedColor }}
              />
              Color
            </button>
            <button
              onClick={() => setActiveTab("size")}
              className={`${styles.tabButton} ${
                activeTab === "size" ? styles.active : ""
              }`}
            >
              Size
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className={styles.closeButton}
            >
              ×
            </button>
          </div>

          <div className={styles.toolbarContent}>
            {activeTab === "font" && (
              <div className={styles.fontList}>
                {FONTS.map((fontName) => {
                  const mapped = fontMap[fontName] || fontName;
                  return (
                    <div key={fontName} className="font-item">
                      <p
                        onClick={() => onFontSelect(fontName)}
                        style={{
                          fontFamily: `'${mapped}', cursive`,
                          fontSize: "0.875rem",
                          cursor: "pointer",
                          opacity: selectedFont === mapped ? 1 : 0.9,
                          fontWeight: selectedFont === mapped ? 600 : 400,
                        }}
                      >
                        {fontName}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === "color" && (
              <div className={styles.colorGrid}>
                {COLORS.map((c) => (
                  <div
                    key={c}
                    style={{ backgroundColor: c }}
                    onClick={() => onColorSelect(c)}
                    className={`${styles.colorButton} ${
                      selectedColor === c ? styles.active : ""
                    }`}
                  />
                ))}
              </div>
            )}

            {activeTab === "size" && (
              <div className={styles.sizeGrid}>
                {SIZES.map((s) => (
                  <button
                    key={s}
                    onClick={() => onSizeSelect(s)}
                    className={`${styles.sizeButton} ${
                      selectedSize === s ? styles.active : ""
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

      {!isEditing && (
        <button
          onClick={() => {
            const canvas = fabricCanvasRef.current;
            const text = canvas?.getObjects().find((o) => o.type === "textbox");
            if (text) {
              canvas.setActiveObject(text);
              text.enterEditing();
              canvas.requestRenderAll();
              activeTextRef.current = text;
              setIsEditing(true);
            }
          }}
          className={styles.editButton}
        >
          Edit Text
        </button>
      )}
    </div>
  );
}
