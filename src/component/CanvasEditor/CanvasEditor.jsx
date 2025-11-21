"use client";
import React, { useEffect, useRef, useState } from "react";
import styles from "./canvas.module.scss";

const SAFE = { left: 140, top: 260, width: 260, height: 180 };

const FONTS = ["Arial", "Asteroid", "BEACHBIKINI", "Beachside", "Blueberry Muffin", "Cakepop", "CALIFORNIA", "DearMay", "Firefly"];
const COLORS = ["#FFFFFF","#000000","#FF3B30","#FF2D55","#5856D6","#007AFF","#34C759","#AF52DE","#FF9500","#FFCC00"];
const SIZES = [10,12,14,16,18,20,22,24,26,28,30,32];

export default function CanvasEditor({ product }) {
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const activeTextRef = useRef(null);

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
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.1/fabric.min.js";
    script.async = true;
    script.onload = () => initCanvas();
    document.body.appendChild(script);

    return () => {
      fabricCanvasRef.current?.dispose();
      fabricCanvasRef.current = null;
    };
  }, [product]);

  const initCanvas = () => {
    const canvas = new window.fabric.Canvas(canvasRef.current, {
      width: 600,
      height: 700,
      backgroundColor: "#f0f0f0",
      preserveObjectStacking: true,
      selection: false,
    });

    fabricCanvasRef.current = canvas;
    loadProductImages(canvas);
  };

  const loadProductImages = (canvas) => {
    const shirtUrl = getRealImageUrl(product?.canvasImage);
    const illustrationUrl = getRealImageUrl(product?.illustrationImage);

    if (!shirtUrl) {
      console.error("No shirt image provided");
      return;
    }

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
                const scaleX = SAFE.width / illuImg.width * 1.2;
                const scaleY = SAFE.height / illuImg.height * 1.2;
                const scale = Math.min(scaleX, scaleY);
                illuImg.set({
                  left: SAFE.left + (SAFE.width - illuImg.width * scale) / 2,
                  top: SAFE.top + (SAFE.height - illuImg.height * scale) / 2,
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
      ? illustration.top + illustration.getScaledHeight() + 10 // 10px below illustration
      : SAFE.top + SAFE.height / 2 - selectedSize / 2;

    const text = new window.fabric.Textbox("YOUR TEXT HERE", {
      left: SAFE.left,
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
    });

    text.on("selected", () => {
      activeTextRef.current = text;
      setIsEditing(true);
      setSelectedFont(text.fontFamily || "Arial");
      setSelectedColor(text.fill || "#000");
      setSelectedSize(text.fontSize || 28);
    });

    text.on("deselected", () => {
      setTimeout(() => {
        if (!canvas.getActiveObject()) setIsEditing(false);
      }, 100);
    });

    canvas.add(text);
    canvas.renderAll();
  };

  const applyChanges = () => {
    if (!activeTextRef.current) return;
    activeTextRef.current.set({
      fontFamily: selectedFont,
      fill: selectedColor,
      fontSize: selectedSize,
    });
    fabricCanvasRef.current?.renderAll();
  };

  useEffect(() => { applyChanges(); }, [selectedFont, selectedColor, selectedSize]);

  return (
    <div className={styles.editorWrapper}>
      <canvas ref={canvasRef} width={600} height={700} className={styles.canvas} />

      {isEditing && (
        <div className={styles.toolbar}>
          <div className={styles.toolbarTabs}>
            <button onClick={() => setActiveTab("font")} className={`${styles.tabButton} ${activeTab === "font" ? styles.active : ""}`}>Font</button>
            <button onClick={() => setActiveTab("color")} className={`${styles.tabButton} ${activeTab === "color" ? styles.active : ""} ${styles.colorTab}`}>
              <span className={styles.colorPreview} style={{backgroundColor: selectedColor}}></span>
              Color
            </button>
            <button onClick={() => setActiveTab("size")} className={`${styles.tabButton} ${activeTab === "size" ? styles.active : ""}`}>Size</button>
            <button onClick={() => setIsEditing(false)} className={styles.closeButton}>×</button>
          </div>

          <div className={styles.toolbarContent}>
            {activeTab === "font" && (
              <div className={styles.fontList}>
                {FONTS.map(f => (
                  <button
                    key={f}
                    style={{fontFamily: f}}
                    onClick={() => setSelectedFont(f)}
                    className={`${styles.fontButton} ${selectedFont === f ? styles.active : ""}`}
                  >{f}</button>
                ))}
              </div>
            )}

            {activeTab === "color" && (
              <div className={styles.colorGrid}>
                {COLORS.map(c => (
                  <button
                    key={c}
                    style={{backgroundColor: c}}
                    onClick={() => setSelectedColor(c)}
                    className={`${styles.colorButton} ${selectedColor === c ? styles.active : ""}`}
                  />
                ))}
              </div>
            )}

            {activeTab === "size" && (
              <div className={styles.sizeGrid}>
                {SIZES.map(s => (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(s)}
                    className={`${styles.sizeButton} ${selectedSize === s ? styles.active : ""}`}
                  >{s}</button>
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
            const text = canvas?.getObjects().find(o => o.type === "textbox");
            if (text) {
              canvas.setActiveObject(text);
              text.enterEditing();
              text.hiddenTextarea?.focus();
              canvas.requestRenderAll();
              setIsEditing(true);
              activeTextRef.current = text;
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
