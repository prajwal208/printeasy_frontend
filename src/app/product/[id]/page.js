"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Plus,
  Minus,
  Heart,
  ChevronLeft,
  ChevronRight,
  Search,
  Truck,
  Gift,
  Percent,
} from "lucide-react";
import Image from "next/image";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Cookies from "js-cookie";
import { db } from "@/lib/db";
import styles from "./ProductDetails.module.scss";
import api from "@/axiosInstance/axiosInstance";
import BottomSheet from "@/component/BottomSheet/BottomSheet";
import AddToCartSuccessSheet from "@/component/AddToCartSuccessSheet/AddToCartSuccessSheet";
import ProductDetailsShimmer from "@/component/ProductDetailsShimmer/ProductDetailsShimmer";
import Suggested from "@/component/Suggested/Suggested";
import { useCart } from "@/context/CartContext";
import bag from "../../../assessts/bag.svg";
import share from "../../../assessts/share.svg";
import ShirtEditor from "@/component/shirtEditor/ShirtEditor";
import {
  createOrder,
  getCashfreeSessionError,
  getFirebaseUidFromToken,
  launchCashfreeCheckout,
  PAYMENT_METHOD,
  persistPendingOrder,
} from "@/lib/payment";
import DynamicModal from "@/component/Modal/Modal";
import AddToBagLoader from "@/component/AddToBagLoader/AddToBagLoader";
import { createSlug } from "@/app/helper";
import {
  getNextUnlockableOffer,
  getOfferVisualUrl,
  offerMinOrderAmount,
  sumCartBagTotal,
} from "@/lib/price";
import ProductSchema from "@/component/seo/ProductSchema";
import ProductPixel from "@/component/seo/ProductPixel";
import YouMayLikeSection from "@/component/YouMayLikeSection/YouMayLikeSection";
import { ChevronUp } from "lucide-react";
import OfferMarquee from "@/component/OfferMarquee/OfferMarquee";
import { getReviewStats, productReviews } from "@/data/productReviews";

const OUT_OF_STOCK_VALUES = new Set(["out_of_stock", "out of stock", "oos"]);

function normalizeSizeKey(str) {
  if (str == null || str === "") return "";
  return String(str).trim().replace(/\s+/g, " ").toLowerCase();
}

/** Extra key so "4-6 Y" and "4-6Y" match the same availability row. */
function compactSizeKey(str) {
  const n = normalizeSizeKey(str);
  return n.replace(/\s+/g, "");
}

/** Map normalized label/value keys → availability string from API `sizeAvailability`. */
function buildSizeAvailabilityMap(sizeAvailability) {
  const map = new Map();
  if (sizeAvailability == null) return map;

  if (Array.isArray(sizeAvailability)) {
    for (const entry of sizeAvailability) {
      if (!entry || typeof entry !== "object") continue;
      const rawStatus =
        entry.status ??
        entry.availability ??
        entry.stock ??
        entry.state ??
        entry.sizeAvailability;
      const status =
        typeof rawStatus === "string" ? rawStatus : rawStatus?.toString?.();
      if (!status) continue;
      const keys = [
        entry.label,
        entry.value,
        entry.size,
        entry.optionLabel,
        entry.optionValue,
        entry.name,
      ];
      for (const k of keys) {
        if (k != null && k !== "") {
          const nk = normalizeSizeKey(k);
          map.set(nk, status);
          map.set(compactSizeKey(k), status);
        }
      }
    }
    return map;
  }

  if (typeof sizeAvailability === "object") {
    for (const [key, val] of Object.entries(sizeAvailability)) {
      const status =
        typeof val === "string"
          ? val
          : val?.status ?? val?.availability ?? val?.stock;
      if (status != null) {
        const s = String(status);
        const nk = normalizeSizeKey(key);
        map.set(nk, s);
        map.set(compactSizeKey(key), s);
      }
    }
  }

  return map;
}

function isSizeOptionOutOfStock(option, availabilityMap) {
  if (!option || !(availabilityMap instanceof Map) || availabilityMap.size === 0) {
    return false;
  }
  const status =
    availabilityMap.get(normalizeSizeKey(option.label)) ??
    availabilityMap.get(normalizeSizeKey(option.value)) ??
    availabilityMap.get(compactSizeKey(option.label)) ??
    availabilityMap.get(compactSizeKey(option.value));
  if (status == null) return false;
  return OUT_OF_STOCK_VALUES.has(String(status).trim().toLowerCase());
}

function normalizeProductImages(product) {
  const raw = product?.productImages ?? product?.product_images;
  if (raw == null) return [];

  const toUrl = (entry) => {
    if (typeof entry === "string") return entry.trim();
    if (entry && typeof entry === "object") {
      return (entry.url ?? entry.src ?? entry.image ?? "").trim();
    }
    return "";
  };

  if (Array.isArray(raw)) {
    return raw.map(toUrl).filter(Boolean);
  }

  if (typeof raw === "object") {
    return Object.values(raw).map(toUrl).filter(Boolean);
  }

  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.map(toUrl).filter(Boolean);
        }
      } catch {
        /* use as single URL */
      }
    }
    return [trimmed];
  }

  return [];
}

const ProductDetails = () => {
  const { id } = useParams();
  const router = useRouter();
  const { updateCart, cartCount } = useCart();

  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState(null);
  const [sizeInfo, setSizeInfo] = useState(null);
  const [showSizeSheet, setShowSizeSheet] = useState(false);
  const [relatedId, setRelatedId] = useState("");
  const [loader, setLoader] = useState(false);
  const [relatedData, setRelatedData] = useState([]);
  const [showSuccessCart, setShowSuccessCart] = useState(false);
  const [isCustomizable, setIsCustomizable] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState("");
  const [selectedSize, setSelectedSize] = useState(28);
  const [selectedFont, setSelectedFont] = useState("Arial");
  const [selectedColor, setSelectedColor] = useState("#ffffff");
  const accessToken = Cookies.get("idToken");
  const [imageUploadLoader, setImageUploadLoader] = useState(false);
  const [showProductUI, setShowProductUI] = useState(true);
  const editorRef = useRef(null);
  const [resumePayment, setResumePayment] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [editorReady, setEditorReady] = useState(false);
  const [selectedSizeYear, setSelectedSizeYear] = useState("");
  const [collectionId, setCollectionId] = useState("");
  const [offers, setOffers] = useState([]);
  const [showOfferSheet, setShowOfferSheet] = useState(false);
  const [cartBagTotal, setCartBagTotal] = useState(0);
  const [cartProductQty, setCartProductQty] = useState(0);
  const [cartProductRowId, setCartProductRowId] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [reviewFilter, setReviewFilter] = useState("ALL");

  const refreshCartBagTotal = useCallback(async () => {
    const items = await db.cart.toArray();
    setCartBagTotal(sumCartBagTotal(items));
  }, []);

  const refreshProductCartState = useCallback(async () => {
    if (!product?.id) return;
    const rows = await db.cart.where("productId").equals(product.id).toArray();
    if (!rows?.length) {
      setCartProductQty(0);
      setCartProductRowId(null);
      return;
    }

    const qty = rows.reduce((n, r) => n + (Number(r.quantity) || 1), 0);
    setCartProductQty(qty);
    setCartProductRowId(rows[0].id);
  }, [product?.id]);

  useEffect(() => {
    if (product) {
      setText(product.presetText || "Empty Text");
      setSelectedColor(product.fontColor || "#000");
      setSelectedFont(product.fontFamily || "");
      setSelectedSize(product.fontSize || 28);
    }
  }, [product]);

  const getOfferData = async () => {
    try {
      const res = await api.get(`/v2/giftreward`, {
        headers: {
          "x-api-key":
            "454ccaf106998a71760f6729e7f9edaf1df17055b297b3008ff8b65a5efd7c10",
        },
      });
      setOffers(res?.data?.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (product) {
      getOfferData();
    }
  }, [product]);

  useEffect(() => {
    refreshCartBagTotal();
  }, [cartCount, id, refreshCartBagTotal]);

  useEffect(() => {
    refreshProductCartState();
  }, [cartCount, id, product?.id, refreshProductCartState]);

  const nextUnlock = getNextUnlockableOffer(offers, cartBagTotal);
  const nextOffer = nextUnlock.nextOffer;

  /** Offer whose icon we show in `freeDeliveryIconCircle` (API-driven image). */
  const circleOffer =
    nextOffer ??
    (offers?.length && nextUnlock.allUnlocked
      ? [...offers]
          .filter((o) => !Number.isNaN(offerMinOrderAmount(o)))
          .sort((a, b) => offerMinOrderAmount(b) - offerMinOrderAmount(a))[0] ??
        offers[0]
      : null);

  const freeDeliveryCircleIconUrl =
    getOfferVisualUrl(circleOffer) ??
    (offers?.length ? getOfferVisualUrl(offers[0]) : null);

  const nextGiftType = nextOffer?.giftType ?? nextOffer?.gift_type;
  const circleGiftType =
    circleOffer?.giftType ?? circleOffer?.gift_type ?? nextGiftType;

  const nextOfferHeadline = (() => {
    const raw = nextOffer?.title?.trim();
    if (raw) return raw;
    if (!nextOffer) return null;
    if (nextGiftType === "freeDelivery") return "Free delivery";
    if (nextGiftType === "discount") return "Order discount";
    return "Reward";
  })();

  const sizeAvailabilityMap = useMemo(
    () => buildSizeAvailabilityMap(product?.sizeAvailability),
    [product?.sizeAvailability]
  );

  console.log(sizeInfo, "sosospopopo");

  const handleSizeSelect = (size) => {
    setSelectedSizeYear(size);

    const match = product?.configuration?.[0]?.options.find(
      (item) => item.value === size
    );

    setSizeInfo(match || null);

    if (match) {
      setSelectedSizeYear(match.value);
    }

    setShowSizeSheet(false);

    // ✅ Use the value directly instead of waiting for state
    if (pendingAction === "PAY_NOW") {
      setPendingAction(null);
      proceedWithPayment(match?.value); // pass the value
    }

    if (pendingAction === "ADD_TO_CART") {
      setPendingAction(null);
      processAddToCart(size); // for ADD_TO_CART you can pass sizeInfo if needed
    }
  };

  const addToCart = async () => {
    setIsEditing(false);

    if (!sizeInfo) {
      setPendingAction("ADD_TO_CART");
      setShowSizeSheet(true);
      return;
    }

    await processAddToCart(selectedSize);
  };

  const processAddToCart = async (sizeInfo) => {
    setLoader(true);
    let capturedImageUrl = "";

    try {
      if (isCustomizable && editorRef.current) {
        console.log("🎨 Attempting image capture...");

        // Add timeout to prevent infinite waiting on iOS
        const capturePromise = editorRef.current.captureImage();
        const timeoutPromise = new Promise(
          (resolve) =>
            setTimeout(() => {
              console.warn(
                "⏱️ Image capture timeout - proceeding without custom image"
              );
              resolve(null);
            }, 10000) // 5 second timeout
        );

        capturedImageUrl = await Promise.race([capturePromise, timeoutPromise]);

        if (capturedImageUrl) {
          console.log("✅ Image captured successfully");
        } else {
          console.warn("⚠️ Using fallback image");
        }
      }
    } catch (error) {
      console.error("❌ Capture image error:", error);
      // Continue without captured image rather than failing
    }

    const payload = {
      productId: product.id,
      categoryId: product.categoryId,
      name: product.name,
      sku: product.sku,
      quantity,
      basePrice: product.basePrice,
      discountPrice: product.discountedPrice || product.basePrice,
      totalPrice: (product.discountedPrice || product.basePrice) * quantity,
      isCustomizable: product.isCustomizable,
      productImageUrl: capturedImageUrl || product.productImages?.[0] || "",
      renderedImageUrl: product.productImages?.[0],
      dimensions: {
        length: product.dimension?.length || 0,
        width: product.dimension?.width || 0,
        height: product.dimension?.height || 0,
        weight: product.dimension?.weight || 0,
      },
      options: selectedSizeYear || sizeInfo,
      addedAt: new Date().toISOString(),
      presetText: text,
      textColor: selectedColor,
      fontFamily: selectedFont,
      fontSize: selectedSize,
      canvasImage: product.canvasImage,
      illustrationImage: product.illustrationImage,
      fullProductUrl: product.productImages[0],
    };

    try {
      const existingItem = !product.isCustomizable
        ? await db.cart.where("productId").equals(product.id).first()
        : null;

      if (existingItem) {
        await db.cart.update(existingItem.id, {
          quantity: existingItem.quantity + quantity,
          totalPrice:
            (existingItem.discountPrice || existingItem.basePrice) *
            (existingItem.quantity + quantity),
        });
      } else {
        await db.cart.add(payload);
      }

      const updatedCartItems = await db.cart.toArray();
      updateCart(updatedCartItems.length);
      setCartBagTotal(sumCartBagTotal(updatedCartItems));
      await refreshProductCartState();
      setShowSuccessCart(true);

      console.log("✅ Item added to cart successfully");
    } catch (err) {
      console.error("❌ Dexie error:", err);
      toast.error("Failed to add to cart");
    } finally {
      setLoader(false);
    }
  };

  const updateCartCountAndProductState = useCallback(async () => {
    const items = await db.cart.toArray();
    updateCart(items.length);
    setCartBagTotal(sumCartBagTotal(items));
    await refreshProductCartState();
  }, [refreshProductCartState, updateCart]);

  const incrementProductQty = async () => {
    if (!product?.id) return;
    const row = cartProductRowId
      ? await db.cart.get(cartProductRowId)
      : await db.cart.where("productId").equals(product.id).first();
    if (!row) return;

    const nextQty = (Number(row.quantity) || 1) + 1;
    const unitPrice = Number(row.discountPrice ?? row.basePrice) || 0;
    await db.cart.update(row.id, {
      quantity: nextQty,
      totalPrice: unitPrice * nextQty,
    });
    await updateCartCountAndProductState();
  };

  const decrementProductQty = async () => {
    if (!product?.id) return;
    const row = cartProductRowId
      ? await db.cart.get(cartProductRowId)
      : await db.cart.where("productId").equals(product.id).first();
    if (!row) return;

    const currQty = Number(row.quantity) || 1;
    const nextQty = currQty - 1;
    if (nextQty <= 0) {
      await db.cart.delete(row.id);
      await updateCartCountAndProductState();
      return;
    }

    const unitPrice = Number(row.discountPrice ?? row.basePrice) || 0;
    await db.cart.update(row.id, {
      quantity: nextQty,
      totalPrice: unitPrice * nextQty,
    });
    await updateCartCountAndProductState();
  };
  const handleWishlistClick = async () => {
    if (!accessToken) {
      toast.warning("Please login to Add to Wishlist");
      return;
    }
    try {
      const res = await api.post(
        `/v2/wishlist`,
        { productId: product.id },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "x-api-key":
              "454ccaf106998a71760f6729e7f9edaf1df17055b297b3008ff8b65a5efd7c10",
          },
        }
      );
      if (res.status === 200) {
        setIsWishlisted(true);
        toast.success("Added to wishlist!");
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to add to wishlist"
      );
    }
  };

  console.log(product?.configuration?.[0]?.options, "sososppyyttttt");

  useEffect(() => {
    setEditorReady(false);
    setSelectedSizeYear("");
    setSizeInfo(null);
    setSelectedImageIndex(0);
  }, [id]);

  useEffect(() => {
    if (selectedImageIndex > 0) {
      setIsEditing(false);
    }
  }, [selectedImageIndex]);

  useEffect(() => {
    if (!product?.configuration?.[0]?.options?.length || !selectedSizeYear) {
      return;
    }
    const opt = product.configuration[0].options.find(
      (o) => o.value === selectedSizeYear
    );
    if (opt && isSizeOptionOutOfStock(opt, sizeAvailabilityMap)) {
      setSelectedSizeYear("");
      setSizeInfo(null);
    }
  }, [product, selectedSizeYear, sizeAvailabilityMap]);

  const handleShare = async () => {
    if (!product?.name) return;

    const slug = createSlug(product?.slug);
    const shareUrl = `https://onrise.in/product/${slug}`;
    const title = product.name;
    const text = title;

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url: shareUrl,
        });
      } catch (error) {
        console.log("Share cancelled", error);
      }
    } else {
      window.open(
        `https://wa.me/?text=${encodeURIComponent(`${title}\n${shareUrl}`)}`,
        "_blank"
      );
    }
  };

  // --- Effects ---

  useEffect(() => {
    let timer;

    const fetchProduct = async () => {
      try {
        setLoading(true);

        const res = await api.get(`/v2/product/${id}`, {
          headers: {
            "x-api-key":
              "454ccaf106998a71760f6729e7f9edaf1df17055b297b3008ff8b65a5efd7c10",
          },
        });

        const data = res?.data?.data;

        setProduct(data);
        setIsCustomizable(!!data?.isCustomizable);
        setRelatedId(data?.id);
        setIsWishlisted(data?.isInWishlist);
        setCollectionId(data?.collectionIds[0]);
      } catch (error) {
        toast.error("Failed to fetch product.");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProduct();

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [id]);

  useEffect(() => {
    if (window.fbq && product) {
      fbq("track", "ViewContent", {
        content_ids: [product.id],
        content_type: "product",
        value: product.discountedPrice,
        currency: "INR",
      });
    }
  }, [product]);

  useEffect(() => {
    if (relatedId) {
      const getRelatedProduct = async () => {
        try {
          const res = await api.get(`/v2/product/${relatedId}/related`, {
            headers: {
              "x-api-key":
                "454ccaf106998a71760f6729e7f9edaf1df17055b297b3008ff8b65a5efd7c10",
            },
          });
          setRelatedData(res?.data?.data);
        } catch (error) {
          console.log("Related fetch error", error);
        }
      };
      getRelatedProduct();
    }
  }, [relatedId]);

  const reviewStats = useMemo(() => getReviewStats(productReviews), []);

  const filteredReviews = useMemo(() => {
    const all = productReviews;
    if (reviewFilter === "PHOTOS") return all.filter((r) => r.hasPhotos);
    if (reviewFilter === "5") return all.filter((r) => Number(r.rating) === 5);
    if (reviewFilter === "4") return all.filter((r) => Number(r.rating) === 4);
    return all;
  }, [reviewFilter]);

  const reviewPhotoThumbs = useMemo(() => {
    const thumbs = [];
    for (const r of productReviews) {
      for (const p of r.photos || []) thumbs.push(p);
    }
    return thumbs.slice(0, 5);
  }, []);

  if (loading) {
    return <ProductDetailsShimmer />;
  }

  const productImages = normalizeProductImages(product);
  const showProductImageGallery = productImages.length > 1;
  const isCanvasPrimaryView = selectedImageIndex === 0;
  const activeProductImageUrl =
    productImages[selectedImageIndex] ?? productImages[0];
  const editorShirtImageSrc = isCanvasPrimaryView
    ? product?.canvasImage
    : productImages[selectedImageIndex];

  const discountPercent =
    product?.discountedPrice && product?.basePrice
      ? Math.round(
          ((product.basePrice - product.discountedPrice) / product.basePrice) *
            100
        )
      : 0;

  const stickyLineTotal =
    (product?.discountedPrice || product?.basePrice || 0) *
    (cartProductQty > 0 ? cartProductQty : 1);

  const uploadImagePayload = {
    printText: text,
    textColor: selectedColor,
    fontFamily: selectedFont,
    fontSize: selectedSize,
    illustrationImage: product?.illustrationImage,
  };

  const handlePayNow = async () => {
    setIsEditing(false);

    if (!sizeInfo) {
      setPendingAction("PAY_NOW");
      setShowSizeSheet(true);
      return;
    }

    // setShowProductUI(false);

    await proceedWithPayment();
  };

  const proceedWithPayment = async (sizeValue) => {
    const sizeToSend = sizeValue || selectedSizeYear;
    try {
      const finalItems = [
        {
          name: product.name,
          sku: product.sku || product.productId,
          totalPrice: product?.discountedPrice,
          quantity: 1,
          categoryId: product.categoryId,
          isCustomizable: !!product.isCustomizable,
          productImageUrl: product?.fullProductUrl,
          discount: product.discount || 0,
          sizeInfo: sizeToSend,
          tax: product.tax || 0,
          hsn: product.hsn || null,
          printingImgText: {
            printText: text,
            textColor: selectedColor,
            fontFamily: selectedFont,
            fontSize: selectedSize,
            illustrationImage: product?.illustrationImage,
            shirtImage: product?.canvasImage,
          },
        },
      ];

      const orderData = await createOrder({
        paymentMethod: PAYMENT_METHOD.ONLINE,
        totalAmount: product?.discountedPrice,
        items: finalItems,
        user: { id: getFirebaseUidFromToken(accessToken) },
      });

      const cashfreeError = getCashfreeSessionError(orderData);
      if (cashfreeError) {
        toast.error(cashfreeError);
        return;
      }

      persistPendingOrder(orderData, PAYMENT_METHOD.ONLINE);
      await launchCashfreeCheckout(orderData.cashfree.sessionId);
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Failed to initiate payment");
      // setShowProductUI(true);
    } finally {
      setImageUploadLoader(false);
    }
  };

  return (
    <>
      {/* <div
        id="cashfree-dropin"
        style={{
          width: "100%",
          minHeight: showProductUI ? "0" : "600px",
          height: showProductUI ? "0" : "auto",
          display: showProductUI ? "none" : "flex",
          justifyContent: "center",
          overflow: "hidden",
          order: -1,
        }}
      /> */}

      <ProductSchema product={product} />
      <ProductPixel product={product} />

      <>
        <div className={styles.pageRoot}>
          <ToastContainer position="top-right" autoClose={2000} />

          <div className={styles.productTopNav}>
            <button
              type="button"
              className={styles.tnavBack}
              onClick={() => router.back()}
              aria-label="Go back"
            >
              <ChevronLeft size={17} strokeWidth={2.5} />
            </button>
            <button
              type="button"
              className={styles.tnavLogo}
              onClick={() => router.push("/")}
            >
              <span>ON</span>RISE
            </button>
            <div className={styles.tnavRight}>
              <button
                type="button"
                className={styles.tnavBtn}
                onClick={() => router.push("/search")}
                aria-label="Search"
              >
                <Search size={16} strokeWidth={2} />
              </button>
              <button
                type="button"
                className={styles.tnavBtn}
                onClick={handleShare}
                aria-label="Share product"
              >
                <Image src={share} alt="" width={16} height={16} />
              </button>
              <button
                type="button"
                className={styles.tnavBtn}
                onClick={() => router.push("/cart")}
                aria-label="Open cart"
              >
                <Image src={bag} alt="" width={16} height={16} />
                {cartCount > 0 && (
                  <span className={styles.tnavBadge}>{cartCount}</span>
                )}
              </button>
            </div>
          </div>

          <div className={styles.container}>
            <div className={styles.productMediaColumn}>
              <div className={styles.mediaHero}>
                <div className={styles.mediaHeroTop}>
                  {discountPercent > 0 && (
                    <span className={styles.mediaOffBadge}>
                      {discountPercent}% OFF
                    </span>
                  )}
                  <button
                    type="button"
                    className={`${styles.mediaWishBtn} ${
                      isWishlisted ? styles.mediaWishBtnLiked : ""
                    }`}
                    onClick={handleWishlistClick}
                    aria-label={
                      isWishlisted ? "Remove from wishlist" : "Add to wishlist"
                    }
                  >
                    <Heart
                      size={15}
                      stroke="#fff"
                      strokeWidth={2}
                      fill={isWishlisted ? "#ff4500" : "transparent"}
                    />
                  </button>
                </div>

                <div className={styles.mediaHeroMain}>
                  {product?.isCustomizable ? (
                    <ShirtEditor
                      product={product}
                      shirtImageSrc={editorShirtImageSrc}
                      hideTextOverlay={!isCanvasPrimaryView}
                      ref={editorRef}
                      isEditing={isEditing}
                      setIsEditing={setIsEditing}
                      text={text}
                      setText={setText}
                      selectedSize={selectedSize}
                      selectedFont={selectedFont}
                      selectedColor={selectedColor}
                      setSelectedColor={setSelectedColor}
                      setSelectedFont={setSelectedFont}
                      setSelectedSize={setSelectedSize}
                      onReady={() => setEditorReady(true)}
                    />
                  ) : (
                    <Image
                      src={activeProductImageUrl}
                      alt="product"
                      width={500}
                      height={600}
                      className={styles.mainImage}
                      priority
                      onLoad={() => setEditorReady(true)}
                    />
                  )}
                </div>

                {product?.isCustomizable && (
                  <button
                    type="button"
                    className={styles.tapHint}
                    onClick={() => setIsEditing(true)}
                  >
                    <span className={styles.tapHintEmoji}>👆</span>
                    <span className={styles.tapHintTxt}>
                      Tap to personalise
                    </span>
                  </button>
                )}

                {productImages.length > 1 && (
                  <div className={styles.mediaDots} role="tablist">
                    {productImages.map((_, index) => (
                      <button
                        type="button"
                        key={index}
                        role="tab"
                        aria-selected={selectedImageIndex === index}
                        aria-label={`Show image ${index + 1}`}
                        className={`${styles.mediaDot} ${
                          selectedImageIndex === index
                            ? styles.mediaDotActive
                            : ""
                        }`}
                        onClick={() => setSelectedImageIndex(index)}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className={styles.mobview}>
                <OfferMarquee />
              </div>

              {showProductImageGallery && (
                <div
                  className={styles.productImageGallery}
                  aria-label="Product images"
                >
                  {productImages.map((src, index) => (
                    <button
                      type="button"
                      key={`${src}-${index}`}
                      className={`${styles.productImageThumb} ${
                        selectedImageIndex === index
                          ? styles.productImageThumbActive
                          : ""
                      }`}
                      onClick={() => setSelectedImageIndex(index)}
                      aria-label={`View product image ${index + 1}`}
                      aria-pressed={selectedImageIndex === index}
                    >
                      <Image
                        src={src}
                        alt=""
                        width={72}
                        height={72}
                        className={styles.productImageThumbImg}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div
              className={`${styles.infoSection} ${
                !isCustomizable ? styles.infoSection_img : ""
              }`}
            >
              <div className={styles.prodInfo}>
                <h1 className={styles.prodName}>{product?.name}</h1>
                <div className={styles.priceRow}>
                  <span className={styles.priceMain}>
                    ₹{product?.discountedPrice}
                  </span>
                  {product?.basePrice > product?.discountedPrice && (
                    <span className={styles.priceOld}>₹{product?.basePrice}</span>
                  )}
                  {discountPercent > 0 && (
                    <span className={styles.priceOffBadge}>
                      {discountPercent}% OFF
                    </span>
                  )}
                </div>
                {product?.isCustomizable && (
                  <button
                    type="button"
                    className={styles.persBar}
                    onClick={() => setIsEditing(true)}
                  >
                    <span className={styles.persIcon}>✏️</span>
                    <span className={styles.persTxt}>
                      Tap the text on shirt to personalise your child&apos;s
                      name FREE
                    </span>
                    <ChevronRight size={14} className={styles.persArrow} />
                  </button>
                )}
                <button
                  type="button"
                  className={styles.offersLink}
                  onClick={() => setShowOfferSheet(true)}
                >
                  View available offers <ChevronUp size={14} strokeWidth={2.5} />
                </button>
              </div>

              {product?.configuration?.[0]?.options?.length > 0 && (
                <>
                  <div className={styles.secGap} />
                  <div className={styles.sizeSec}>
                    <h4 className={styles.sizeTitle}>Select Size</h4>
                    {sizeInfo && (
                      <div className={styles.sizeDetailsBox}>
                        {sizeInfo.options?.find((opt) => opt.label === "Chest")
                          ?.value && (
                          <span>
                            Chest:{" "}
                            {
                              sizeInfo.options.find(
                                (opt) => opt.label === "Chest"
                              ).value
                            }{" "}
                            cm
                          </span>
                        )}
                        {sizeInfo.options?.find((opt) => opt.label === "Length")
                          ?.value && (
                          <span>
                            Length:{" "}
                            {
                              sizeInfo.options.find(
                                (opt) => opt.label === "Length"
                              ).value
                            }{" "}
                            cm
                          </span>
                        )}
                        {sizeInfo.options?.find((opt) => opt.label === "Sleeves")
                          ?.value && (
                          <span>
                            Sleeves:{" "}
                            {
                              sizeInfo.options.find(
                                (opt) => opt.label === "Sleeves"
                              ).value
                            }{" "}
                            cm
                          </span>
                        )}
                      </div>
                    )}
                    <div className={styles.sizeOptions}>
                      {product?.configuration[0].options.map((s) => {
                        const outOfStock = isSizeOptionOutOfStock(
                          s,
                          sizeAvailabilityMap
                        );
                        return (
                          <button
                            type="button"
                            key={s.value}
                            disabled={outOfStock}
                            onClick={() => handleSizeSelect(s.value)}
                            className={`${styles.sizeBtn} ${
                              selectedSizeYear === s.value
                                ? styles.activeSize
                                : ""
                            } ${outOfStock ? styles.sizeBtnOutOfStock : ""}`}
                          >
                            <span className={styles.sizeBtnLabel}>
                              {s.label}
                            </span>
                            {outOfStock ? (
                              <span className={styles.sizeBtnStockLabel}>
                                Out of stock
                              </span>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              <div className={styles.secGap} />
              <div className={styles.revSec} id="revSec">
                <div className={styles.secHdr}>
                  <div className={styles.secTitle}>Customer Reviews</div>
                  <button
                    type="button"
                    className={styles.secLink}
                    onClick={() => {
                      const el = document.getElementById("revSec");
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                    }}
                  >
                    See all {reviewStats.total} →
                  </button>
                </div>

                <div className={styles.ratingSummary}>
                  <div className={styles.rbBig}>
                    <div className={styles.rbBigNum}>{reviewStats.avg}</div>
                    <div className={styles.rbBigStars} aria-label="Rating">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span
                          key={i}
                          className={`${styles.rbBigS} ${
                            i < Math.round(reviewStats.avg)
                              ? ""
                              : styles.rbBigSEmpty
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <div className={styles.rbBigCnt}>
                      {reviewStats.total} reviews
                    </div>
                  </div>
                  <div className={styles.rbBars}>
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = reviewStats.byStar[star] || 0;
                      const pct =
                        reviewStats.total > 0
                          ? Math.round((count / reviewStats.total) * 100)
                          : 0;
                      return (
                        <div key={star} className={styles.rbRow}>
                          <div className={styles.rbLbl}>{star}</div>
                          <div className={styles.rbTrack}>
                            <div
                              className={styles.rbFill}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <div className={styles.rbCnt}>{count}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className={styles.revFilters}>
                  <button
                    type="button"
                    className={`${styles.rf} ${
                      reviewFilter === "ALL" ? styles.rfOn : styles.rfOff
                    }`}
                    onClick={() => setReviewFilter("ALL")}
                  >
                    All ({reviewStats.total})
                  </button>
                  <button
                    type="button"
                    className={`${styles.rf} ${
                      reviewFilter === "PHOTOS" ? styles.rfOn : styles.rfOff
                    }`}
                    onClick={() => setReviewFilter("PHOTOS")}
                  >
                    With Photos ({reviewStats.withPhotos})
                  </button>
                  <button
                    type="button"
                    className={`${styles.rf} ${
                      reviewFilter === "5" ? styles.rfOn : styles.rfOff
                    }`}
                    onClick={() => setReviewFilter("5")}
                  >
                    5 ★ ({reviewStats.byStar[5] || 0})
                  </button>
                  <button
                    type="button"
                    className={`${styles.rf} ${
                      reviewFilter === "4" ? styles.rfOn : styles.rfOff
                    }`}
                    onClick={() => setReviewFilter("4")}
                  >
                    4 ★ ({reviewStats.byStar[4] || 0})
                  </button>
                </div>

                <div className={styles.photoRow}>
                  {reviewPhotoThumbs.map((p, idx) => (
                    <button
                      key={`${p}-${idx}`}
                      type="button"
                      className={styles.phThumb}
                      aria-label="Review photo"
                    >
                      {p}
                    </button>
                  ))}
                  {productReviews.reduce((n, r) => n + (r.photos?.length || 0), 0) >
                  reviewPhotoThumbs.length ? (
                    <button
                      type="button"
                      className={styles.phThumb}
                      aria-label="More photos"
                    >
                      <span>👧</span>
                      <span className={styles.phMore}>
                        +
                        {Math.max(
                          0,
                          productReviews.reduce(
                            (n, r) => n + (r.photos?.length || 0),
                            0
                          ) - reviewPhotoThumbs.length
                        )}
                      </span>
                    </button>
                  ) : null}
                </div>

                <div className={styles.revCards}>
                  {filteredReviews.map((r) => (
                    <div key={r.id} className={styles.revCard}>
                      <div className={styles.rcTop}>
                        <div className={styles.rcUser}>
                          <div
                            className={styles.rcAv}
                            style={{ background: r.color }}
                          >
                            {r.initial}
                          </div>
                          <div>
                            <div className={styles.rcName}>{r.name}</div>
                            <div className={styles.rcDate}>
                              {r.date} · {r.location}
                            </div>
                            <div className={styles.rcVer}>
                              Verified Purchase
                            </div>
                          </div>
                        </div>
                        <div className={styles.rcStars} aria-label="Stars">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span
                              key={i}
                              className={`${styles.rcS} ${
                                i < r.rating ? "" : styles.rcSEmpty
                              }`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className={styles.rcTitle}>{r.title}</div>
                      <div className={styles.rcText}>{r.text}</div>
                      {r.photos?.length ? (
                        <div className={styles.rcImgs}>
                          {r.photos.slice(0, 2).map((p, idx) => (
                            <div key={idx} className={styles.rcImg}>
                              {p}
                            </div>
                          ))}
                        </div>
                      ) : null}
                      {r.tags?.length ? (
                        <div className={styles.rcTags}>
                          {r.tags.map((t) => (
                            <span key={t} className={styles.rcTag}>
                              {t}
                            </span>
                          ))}
                        </div>
                      ) : null}
                      <div className={styles.rcBtm}>
                        <div className={styles.rcHelpfulTxt}>
                          {r.helpfulCount} people found this helpful
                        </div>
                        <button
                          type="button"
                          className={styles.rcHelpfulBtn}
                          onClick={() => toast("Thanks for your feedback!")}
                        >
                          Helpful
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* <button
                    type="button"
                    className={styles.writeRev}
                    onClick={() => toast("Review flow coming soon")}
                  >
                    <span className={styles.wrIcon}>✍️</span>
                    <span className={styles.wrTxtWrap}>
                      <span className={styles.wrTitle}>
                        Bought this? Write a review
                      </span>
                      <span className={styles.wrSub}>
                        Help other parents make the right choice
                      </span>
                    </span>
                    <span className={styles.wrArr}>›</span>
                  </button> */}
                </div>
              </div>

              <div className={styles.secGap} />
              <div className={styles.accSec}>
                {[
                  { title: "DETAILS", content: product?.description },
                  { title: "CARE", content: product?.care },
                ].map((item, i) => (
                  <div key={i} className={styles.accItem}>
                    <button
                      type="button"
                      className={styles.accHdr}
                      onClick={() =>
                        setActiveSection(activeSection === i ? null : i)
                      }
                      aria-expanded={activeSection === i}
                    >
                      <span className={styles.accTitle}>{item.title}</span>
                      <span
                        className={`${styles.accIcon} ${
                          activeSection === i ? styles.accIconOpen : ""
                        }`}
                      >
                        +
                      </span>
                    </button>
                    <div
                      className={`${styles.accBody} ${
                        activeSection === i ? styles.accBodyOpen : ""
                      }`}
                    >
                      <p>{item.content}</p>
                    </div>
                  </div>
                ))}
              </div>

            {/* Size Selection Sheet (Triggered if no size selected) */}
            <BottomSheet
              open={showSizeSheet}
              onClose={() => setShowSizeSheet(false)}
            >
              <h3 style={{ textAlign: "center", marginBottom: "15px" }}>
                SELECT A SIZE
              </h3>
              <div className={styles.sizeOptionsSheet}>
                {product?.configuration?.[0]?.options.map((s) => {
                  const outOfStock = isSizeOptionOutOfStock(
                    s,
                    sizeAvailabilityMap
                  );
                  return (
                    <button
                      type="button"
                      key={s.value}
                      disabled={outOfStock}
                      onClick={() => handleSizeSelect(s.value)}
                      className={`${styles.sizeBtn} ${
                        selectedSizeYear === s.value ? styles.activeSize : ""
                      } ${outOfStock ? styles.sizeBtnOutOfStock : ""}`}
                    >
                      <span className={styles.sizeBtnLabel}>{s.label}</span>
                      {outOfStock ? (
                        <span className={styles.sizeBtnStockLabel}>
                          Out of stock
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </BottomSheet>

            <DynamicModal
              open={imageUploadLoader}
              onClose={() => setImageUploadLoader(false)}
            >
              <AddToBagLoader />
            </DynamicModal>

            {/* Success Sheet */}
            <BottomSheet
              open={showSuccessCart}
              onClose={() => setShowSuccessCart(false)}
            >
              <AddToCartSuccessSheet relatedData={relatedData} />
            </BottomSheet>

            <BottomSheet
              open={showOfferSheet}
              onClose={() => setShowOfferSheet(false)}
            >
              <div className={styles.offerSheet}>
                <h3>Available Offers</h3>

                {offers?.map((item) => {
                  const sheetImg = getOfferVisualUrl(item);
                  return (
                    <div key={item.id} className={styles.offerCard}>
                      {sheetImg ? (
                        <div className={styles.offerSheetThumb}>
                          <Image
                            src={sheetImg}
                            alt=""
                            width={52}
                            height={52}
                            className={styles.offerSheetThumbImg}
                          />
                        </div>
                      ) : null}
                      <div className={styles.offerCardBody}>
                        <div className={styles.offerlist}>
                          <p className={styles.offerCardTitle}>{item.title}</p>

                          <span className={styles.offerMin}>
                            <strong>
                              Min Order ₹
                              {item.minOrderAmount ?? item.min_order_amount}
                            </strong>
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </BottomSheet>
            </div>
          </div>

          <div className={styles.webview}>
            <OfferMarquee />
          </div>

          <div className={styles.pageSpacer} aria-hidden />

          <div className={styles.stickyBar}>
            {cartProductQty > 0 ? (
              <>
                <button
                  type="button"
                  className={styles.vcBtn}
                  onClick={() => router.push("/cart")}
                >
                  {cartCount > 0 && (
                    <span className={styles.vcBadge}>{cartCount}</span>
                  )}
                  <Image src={bag} alt="" width={17} height={17} />
                  <span className={styles.vcTxt}>View Cart</span>
                </button>
                <div className={styles.qtyStepper} aria-label="Quantity">
                  <button
                    type="button"
                    className={styles.qtyBtn}
                    onClick={decrementProductQty}
                    aria-label="Decrease quantity"
                  >
                    <Minus size={16} />
                  </button>
                  <div className={styles.qtyValue}>{cartProductQty}</div>
                  <button
                    type="button"
                    className={styles.qtyBtn}
                    onClick={incrementProductQty}
                    aria-label="Increase quantity"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className={styles.vcBtn}
                  onClick={() => router.push("/cart")}
                >
                  {cartCount > 0 && (
                    <span className={styles.vcBadge}>{cartCount}</span>
                  )}
                  <Image src={bag} alt="" width={17} height={17} />
                  <span className={styles.vcTxt}>View Cart</span>
                </button>
                <button
                  type="button"
                  className={styles.addBtn}
                  onClick={addToCart}
                  disabled={loader}
                >
                  <span className={styles.addBtnLabel}>
                    {loader ? "ADDING..." : "ADD TO CART"}
                  </span>
                  <span className={styles.addBtnAmt}>₹{stickyLineTotal}</span>
                </button>
              </>
            )}
          </div>

          <section className={styles.relatedSection}>
            {collectionId ? (
              <YouMayLikeSection categoryId={collectionId} />
            ) : (
              <Suggested relatedData={relatedData} />
            )}
          </section>
        </div>
      </>
    </>
  );
};

export default ProductDetails;
