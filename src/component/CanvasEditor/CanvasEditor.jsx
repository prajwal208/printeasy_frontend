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
  const CONTAINER_WIDTH = 200;
  const CONTAINER_HEIGHT = 70;

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

  // Detect iOS device
  const isIOS = () => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  };

  const focusTextarea = (textObj) => {
    try {
      const ta = textObj.hiddenTextarea;
      if (!ta) return;
      
      if (isIOS()) {
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        ta.style.top = '0';
        ta.style.width = '1px';
        ta.style.height = '1px';
        ta.style.opacity = '0';
        ta.style.pointerEvents = 'none';
        ta.style.zIndex = '-1';
        ta.readOnly = false;
        ta.removeAttribute('readonly');
        
        if (!ta.hasAttribute('inputmode')) {
          ta.setAttribute('inputmode', 'text');
        }
        if (!ta.hasAttribute('autocapitalize')) {
          ta.setAttribute('autocapitalize', 'off');
        }
        if (!ta.hasAttribute('autocorrect')) {
          ta.setAttribute('autocorrect', 'off');
        }
        
        const clickEvent = new MouseEvent('click', {
          view: window,
          bubbles: true,
          cancelable: true,
        });
        ta.dispatchEvent(clickEvent);
        ta.focus();
        
        setTimeout(() => {
          try {
            ta.setSelectionRange(ta.value.length, ta.value.length);
          } catch (e) {}
        }, 0);
      } else {
        requestAnimationFrame(() => {
          ta.focus({ preventScroll: true });
          ta.setSelectionRange(ta.value.length, ta.value.length);
        });
      }
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
      : SAFE.top + SAFE.height / 2 - 75;

    const fontName =
      fontMap[product?.fontFamily] || product?.fontFamily || selectedFont;
    const fontData = fonts.find((f) => f.family === fontName);

    if (fontData) {
      await loadFont(fontData);
      await document.fonts.ready;
    }
    
    const text = new window.fabric.Textbox(
      product?.presetText || "YOUR TEXT HERE",
      {
        left: SAFE.left + 20 + (SAFE.width - CONTAINER_WIDTH) / 2,
        top: topPos + 175,
        width: CONTAINER_WIDTH,
        fontSize: defaultFontSize,
        fontFamily: defaultFontFamily,
        fill: defaultFontColor,
        textAlign: "center",
        fontWeight: "normal",
        lineHeight:1,
        splitByGrapheme: true,
        editable: true,
        lockMovementX: true,
        lockMovementY: true,
        lockScalingX: true,
        lockScalingY: true,
        hasControls: false,
        hasBorders: true,
        borderColor: '#ddd',
        selectable: true,
        dynamicMinWidth: CONTAINER_WIDTH,
        minWidth: CONTAINER_WIDTH,
        lockUniScaling: true,
      }
    );

    // Store scroll position
    let scrollOffset = 0;

    // Override _wrapText to prevent height changes and calculate proper wrapping
    const originalWrapText = text._wrapText;
    text._wrapText = function(lines, desiredWidth) {
      const result = originalWrapText.call(this, lines, desiredWidth);
      // Force fixed height, no matter what
      this._textLines = result;
      return result;
    };

    // Override _renderTextLinesBackground and related methods to respect scroll
    const originalRenderText = text._renderText;
    text._renderText = function(ctx) {
      ctx.save();
      
      // Apply scroll offset
      if (scrollOffset > 0) {
        ctx.translate(0, -scrollOffset);
      }
      
      originalRenderText.call(this, ctx);
      ctx.restore();
    };

    // Override _render to clip content and maintain fixed dimensions
    const originalRender = text._render;
    text._render = function(ctx) {
      // Force dimensions before any render
      this.width = CONTAINER_WIDTH;
      this.height = CONTAINER_HEIGHT;
      
      ctx.save();
      
      // Clip to fixed container bounds
      ctx.beginPath();
      ctx.rect(-CONTAINER_WIDTH / 2, -CONTAINER_HEIGHT / 2, CONTAINER_WIDTH, CONTAINER_HEIGHT);
      ctx.clip();
      
      originalRender.call(this, ctx);
      ctx.restore();
    };

    // Completely lock dimensions
    const lockDimensions = () => {
      Object.defineProperty(text, 'width', {
        get: function() { return CONTAINER_WIDTH; },
        set: function(value) { /* Locked */ },
        configurable: true
      });
      
      Object.defineProperty(text, 'height', {
        get: function() { return CONTAINER_HEIGHT; },
        set: function(value) { /* Locked */ },
        configurable: true
      });
    };
    
    lockDimensions();

    // Style textarea for scrolling
    const styleTextarea = () => {
      try {
        const ta = text.hiddenTextarea;
        if (ta) {
          ta.style.position = 'fixed';
          ta.style.width = `${CONTAINER_WIDTH}px`;
          ta.style.height = `${CONTAINER_HEIGHT}px`;
          ta.style.maxHeight = `${CONTAINER_HEIGHT}px`;
          ta.style.minHeight = `${CONTAINER_HEIGHT}px`;
          ta.style.overflowY = 'scroll'; // Always show scrollbar
          ta.style.overflowX = 'hidden';
          ta.style.whiteSpace = 'pre-wrap';
          ta.style.wordWrap = 'break-word';
          ta.style.wordBreak = 'break-word';
          ta.style.boxSizing = 'border-box';
          ta.style.padding = '8px';
          ta.style.resize = 'none';
          ta.style.border = '1px solid #ddd';
          ta.style.borderRadius = '4px';
          ta.style.background = 'rgba(255, 255, 255, 0.95)';
          ta.style.zIndex = '10000';
          ta.style.fontFamily = text.fontFamily;
          ta.style.fontSize = text.fontSize + 'px';
          ta.style.color = text.fill;
          ta.style.textAlign = text.textAlign;
          ta.style.lineHeight = text.lineHeight;
          
          if (isIOS()) {
            ta.style.webkitOverflowScrolling = 'touch';
            ta.style.transform = 'translate3d(0,0,0)';
          }

          const canvasRect = canvasRef.current.getBoundingClientRect();
          const zoom = canvas.getZoom();
          const textLeft = text.left * zoom + canvasRect.left;
          const textTop = text.top * zoom + canvasRect.top;
          
          ta.style.left = `${textLeft}px`;
          ta.style.top = `${textTop}px`;
          
          // Sync scroll with canvas rendering
          ta.addEventListener('scroll', () => {
            canvas.requestRenderAll();
          });
        }
      } catch (e) {
        console.log("Textarea styling failed", e);
      }
    };

    // Handle text input with dimension locking
    const handleTextInput = () => {
      // Force lock dimensions - CRITICAL
      text.width = CONTAINER_WIDTH;
      text.height = CONTAINER_HEIGHT;
      
      // Clear cache to force recalculation
      text._clearCache();
      
      // Re-apply dimension locks
      lockDimensions();
      
      canvas.requestRenderAll();
      styleTextarea();
      
      setPrintingImg({
        textColor: text.fill,
        fontFamily: text.fontFamily,
        printText: text.text,
        fontSize: text.fontSize,
      });
    };

    text.on("changed", handleTextInput);
    text.on("modified", handleTextInput);
    text.on("scaling", () => {
      text.width = CONTAINER_WIDTH;
      text.height = CONTAINER_HEIGHT;
      canvas.requestRenderAll();
    });
    
    text.on("editing:entered", () => {
      text.width = CONTAINER_WIDTH;
      text.height = CONTAINER_HEIGHT;
      styleTextarea();
      
      if (isIOS()) {
        setTimeout(() => {
          focusTextarea(text);
          styleTextarea();
        }, 10);
      }
    });

    text.on("editing:exited", () => {
      text.width = CONTAINER_WIDTH;
      text.height = CONTAINER_HEIGHT;
      canvas.renderAll();
    });

    canvas.add(text);
    canvas.setActiveObject(text);
    
    setTimeout(() => {
      text.set({
        width: CONTAINER_WIDTH,
        height: CONTAINER_HEIGHT
      });
      styleTextarea();
    }, 50);
    
    if (isIOS()) {
      setTimeout(() => {
        text.enterEditing();
        styleTextarea();
        focusTextarea(text);
        canvas.requestRenderAll();
      }, 100);
    } else {
      text.enterEditing();
      styleTextarea();
      canvas.requestRenderAll();
    }
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
      height: CONTAINER_HEIGHT
    });

    canvas.setActiveObject(textObj);
    
    const styleAndFocus = () => {
      const ta = textObj.hiddenTextarea;
      if (ta) {
        ta.style.width = `${CONTAINER_WIDTH}px`;
        ta.style.height = `${CONTAINER_HEIGHT}px`;
        ta.style.maxHeight = `${CONTAINER_HEIGHT}px`;
        ta.style.overflowY = 'scroll';
        ta.style.overflowX = 'hidden';
        ta.style.position = 'fixed';
        ta.style.boxSizing = 'border-box';
        ta.style.padding = '0px';
        ta.style.resize = 'none';
        
        if (isIOS()) {
          ta.style.webkitOverflowScrolling = 'touch';
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
      height: CONTAINER_HEIGHT
    });
    
    canvas?.requestRenderAll();
    
    try {
      const ta = obj.hiddenTextarea;
      if (ta) {
        ta.style.width = `${CONTAINER_WIDTH}px`;
        ta.style.height = `${CONTAINER_HEIGHT}px`;
        ta.style.maxHeight = `${CONTAINER_HEIGHT}px`;
        ta.style.minHeight = `${CONTAINER_HEIGHT}px`;
        ta.style.overflowY = 'scroll';
        ta.style.overflowX = 'hidden';
        ta.style.boxSizing = 'border-box';
        ta.style.padding = '0px';
        ta.style.resize = 'none';
        
        if (props.fontFamily) ta.style.fontFamily = props.fontFamily;
        if (props.fill) ta.style.color = props.fill;
        if (props.fontSize) ta.style.fontSize = props.fontSize + "px";
        
        if (isIOS()) {
          ta.style.webkitOverflowScrolling = 'touch';
          ta.style.transform = 'translate3d(0,0,0)';
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