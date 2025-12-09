"use client";
import React, { useEffect, useRef, useState } from "react";
import { ChevronLeft, ShoppingBag, Heart, Share2 } from "lucide-react";
import styles from "./canvas.module.scss";
import { COLORS, fontMap, FONTS, SIZES } from "@/constants";
import { useRouter } from "next/navigation";
import bag from "../../assessts/bag.svg";
import share from "../../assessts/share.svg";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import api from "@/axiosInstance/axiosInstance";

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
  const [canvasbackground, setCanvasBackground] = useState("");
  const router = useRouter();
  const { cartCount } = useCart();
  const count = localStorage.getItem("count");

  const loadedFonts = new Set();

  const loadFont = async (font) => {
    if (!font) return;

    const family = typeof font === "string" ? font : font.family;
    const url = typeof font === "string" ? font.downloadUrl : font.downloadUrl;

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

        // Update toolbar
        setSelectedFont(target.fontFamily || "Arial");
        setSelectedColor(target.fill || "#000000");
        setSelectedSize(target.fontSize || 28);

        setTimeout(() => {
          target.enterEditing();

          // Do NOT call selectAll()
          // Do NOT set selection start/end
          // → Fabric.js will automatically place cursor where user clicked!

          const textarea = target.hiddenTextarea;
          if (textarea) {
            textarea.focus();
          }

          setIsEditing(true);
          canvas.requestRenderAll();
        }, 0);

        return;
      }

      // Click outside
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

        shirtImg.set({
          scaleX: scale,
          scaleY: scale,
          top: 125,
          left: 100,
        });

        // Set as Fabric background
        canvas.setBackgroundImage(shirtImg, () => {
          canvas.renderAll();
          addTextBelowIllustration(canvas, null);

          // Extract background color
          const tempCanvas = document.createElement("canvas");
          tempCanvas.width = shirtImg.width;
          tempCanvas.height = shirtImg.height;
          const ctx = tempCanvas.getContext("2d");
          ctx.drawImage(shirtImg._element, 0, 0);

          // Get pixel data of top-left corner (0,0)
          const pixelData = ctx.getImageData(0, 0, 1, 1).data;
          const bgColor = `rgb(${pixelData[0]}, ${pixelData[1]}, ${pixelData[2]})`;
          setCanvasBackground(bgColor);
          console.log("Background color:", typeof bgColor);
        });
      },
      { crossOrigin: "anonymous" }
    );
  };

  // useEffect(() => {
  //   Object.values(fontMap).forEach((font) => {
  //     loadFont(font);
  //   });
  // }, []);

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

    // Load matching font object from API response
    const fontData = fonts.find((f) => f.family === fontName);

    if (fontData) {
      await loadFont(fontData);

      // Ensure browser fully registers font BEFORE rendering
      await document.fonts.ready;
    }

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

    const textObj =
      activeTextRef.current ||
      canvas.getObjects().find((o) => o.type === "textbox");

    if (!textObj) return;

    canvas.setActiveObject(textObj);

    // Allow fabric time to activate object then start editing
    setTimeout(() => {
      textObj.enterEditing();
      textObj.selectAll();
      canvas.requestRenderAll();

      // Force focus into hidden textarea (VERY IMPORTANT)
      try {
        const ta = textObj.hiddenTextarea;
        if (ta) ta.focus();
      } catch (err) {
        console.log("Textarea focus failed", err);
      }

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
      if (res?.status === 200) {
        setIsWishlisted(true);
      }
    } catch (err) {
      console.log("Failed to add wishlist:", err);
    }
  };

  useEffect(() => {
    const toolbar = document.querySelector(`.${styles.floatingToolbar}`);
    const editor = document.querySelector(`.${styles.editorWrapper}`);

    if (!toolbar || !editor || !window.visualViewport) return;

    const updatePosition = () => {
      const viewport = window.visualViewport;

      if (viewport.height < window.innerHeight - 100) {
        // Keyboard is open
        const keyboardHeight = window.innerHeight - viewport.height;

        toolbar.style.bottom = `${keyboardHeight + 10}px`;
        editor.style.paddingBottom = `${keyboardHeight + 80}px`;
      } else {
        // Keyboard is closed
        toolbar.style.bottom = `20px`;
        editor.style.paddingBottom = `0px`;
      }
    };

    window.visualViewport.addEventListener("resize", updatePosition);
    window.visualViewport.addEventListener("scroll", updatePosition);

    return () => {
      window.visualViewport.removeEventListener("resize", updatePosition);
      window.visualViewport.removeEventListener("scroll", updatePosition);
    };
  }, []);

  useEffect(() => {
  fonts.forEach(async (font) => {
    if (!loadedFonts.has(font.family)) {
      await loadFont(font);
      await document.fonts.load(`16px ${font.family}`);
      loadedFonts.add(font.family);
    }
  });
}, [fonts]);

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

          <div className={styles.toolButton} onClick={startTextEditing}>
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
