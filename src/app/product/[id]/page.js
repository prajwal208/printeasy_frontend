"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Plus, Minus, Heart, ChevronLeft } from "lucide-react";
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
import { load } from "@cashfreepayments/cashfree-js";
import DynamicModal from "@/component/Modal/Modal";
import AddToBagLoader from "@/component/AddToBagLoader/AddToBagLoader";

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

  console.log(text, "dskdnskdiiioiiioio", selectedColor);

  useEffect(() => {
    if (product) {
      setText(product.presetText || "Empty Text");
      setSelectedColor(product.fontColor || "#000");
      setSelectedFont(product.fontFamily || "");
      setSelectedSize(product.fontSize || 28);
    }
  }, [product]);

  const handleSizeSelect = (size, autoAdd = false) => {
    setSelectedSize(size);
    const match = product?.configuration?.[0]?.options.find(
      (item) => item.value === size
    );
    setSizeInfo(match || null);

    if (autoAdd) {
      processAddToCart(size);
    }
  };

  const addToCart = async () => {
    setIsEditing(false);
    if (product?.configuration?.length > 0 && !selectedSize) {
      setShowSizeSheet(true);
      return;
    }
    await processAddToCart(selectedSize);
  };

  const processAddToCart = async (sizeToUse) => {
    setLoader(true);
    let capturedImageUrl = "";

    try {
      if (isCustomizable && editorRef.current) {
        capturedImageUrl = await editorRef.current.captureImage();
      }
    } catch (error) {
      console.error("Capture image error:", error);
    }

    console.log(product, "dnsdsjdiuuyyyyy");

    console.log(product, "djkjkjdfijfidfidfidnvnvnvn");
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
      renderedImageUrl: capturedImageUrl,
      dimensions: {
        length: product.dimension?.length || 0,
        width: product.dimension?.width || 0,
        height: product.dimension?.height || 0,
        weight: product.dimension?.weight || 0,
      },
      options: [{ label: "Size", value: sizeToUse }],
      addedAt: new Date().toISOString(),
      presetText: text,
      textColor: selectedColor,
      fontFamily: selectedFont,
      fontSize: selectedSize,
      canvasImage: product.canvasImage,
      illustrationImage: product.illustrationImage,
      fullProductUrl: product.productImages[0],
    };

    console.log(payload, "dskdnskdoooooooo");

    try {
      const existingItem = await db.cart
        .where("productId")
        .equals(product.id)
        .first();

      if (existingItem) {
        await db.cart.update(existingItem.id, {
          quantity: existingItem.quantity + quantity,
          totalPrice:
            (existingItem.discountPrice || existingItem.basePrice) *
            (existingItem.quantity + quantity),
          productImageUrl: capturedImageUrl || existingItem.productImageUrl,
        });
      } else {
        await db.cart.add(payload);
      }

      const updatedCartItems = await db.cart.toArray();
      updateCart(updatedCartItems.length);
      setShowSuccessCart(true);
    } catch (err) {
      console.error("Dexie error:", err);
      toast.error("Failed to add to cart");
    } finally {
      setLoader(false);
    }
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

  const handleShare = async () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.name || "Check this out!",
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

  // --- Effects ---

  useEffect(() => {
    const fetchProduct = async () => {
      try {
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
      } catch (error) {
        toast.error("Failed to fetch product.");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProduct();
  }, [id]);

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

  if (loading && !product) return <ProductDetailsShimmer />;

  const uploadImagePayload = {
    printText: text,
    textColor: selectedColor,
    fontFamily: selectedFont,
    fontSize: selectedSize,
    illustrationImage: product?.illustrationImage,
  };

  const handlePayNow = async () => {
    try {
      setImageUploadLoader(true);
      let renderedImageUrl = null;

      if (uploadImagePayload) {
        const uploadRes = await api.post(
          "/v1/cart/upload-image",
          { printingImgText: uploadImagePayload },
          {
            headers: {
              "x-api-key":
                "454ccaf106998a71760f6729e7f9edaf1df17055b297b3008ff8b65a5efd7c10",
            },
          }
        );
        renderedImageUrl = uploadRes?.data?.data?.renderedImageUrl || null;
      }

      const finalItems = [
        {
          imageUrl: renderedImageUrl,
          name: product.name,
          sku: product.sku || product.productId,
          totalPrice: product.totalPrice,
          quantity: product.quantity,
          categoryId: product.categoryId,
          isCustomizable: !!product.isCustomizable,
          productImageUrl: product?.fullProductUrl,
          discount: product.discount || 0,
          tax: product.tax || 0,
          hsn: product.hsn || null,
          quantity: 1,
          totalPrice: product?.discountedPrice,
        },
      ];

      const orderRes = await api.post(
        "/v1/orders/create",
        {
          paymentMethod: "ONLINE",
          totalAmount: product?.discountedPrice,
          items: finalItems,
        },
        {
          headers: {
            "x-api-key":
              "454ccaf106998a71760f6729e7f9edaf1df17055b297b3008ff8b65a5efd7c10",
          },
        }
      );

      const orderData = orderRes?.data?.data;
      const paymentSessionId = orderData?.cashfree?.sessionId;
      const cashfreeOrderId = orderData?.cashfree?.orderId;
      const backendOrderId = orderData?.orderId;

      if (!paymentSessionId) {
        toast.error("Payment session not generated");
        setImageUploadLoader(false);
        return;
      }

      // Store order data in localStorage for order-success page
      localStorage.setItem("pendingOrderId", backendOrderId);
      localStorage.setItem("pendingCashfreeOrderId", cashfreeOrderId);
      localStorage.setItem("pendingOrderAmount", product?.discountedPrice);

      // console.log("Stored order data:", {
      //   pendingOrderId: backendOrderId,
      //   pendingCashfreeOrderId: cashfreeOrderId,
      //   pendingOrderAmount: grandTotal,
      // });

      // Hide cart UI and show checkout
      setShowProductUI(false);
      setImageUploadLoader(false);

      const cashfree = await load({ mode: "production" });

      // Embedded checkout with proper callback structure
      const checkoutOptions = {
        paymentSessionId: paymentSessionId,
        redirectTarget: document.getElementById("cashfree-dropin"), // Your embedded div
      };

      cashfree.checkout(checkoutOptions).then((result) => {
        if (result.error) {
          console.error("SDK Error:", result.error);
          toast.error(result.error.message);
          setShowProductUI(true);
        }

        // If the payment is completed (success or failure)
        if (result.paymentDetails) {
          console.log("Payment completed, checking status...");
          // Force redirect to your success page
          window.location.href = `/order-success?order_id=${cashfreeOrderId}`;
        }

        if (result.redirect) {
          console.log("SDK handled redirection automatically");
        }
      });
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Failed to initiate payment");
      setImageUploadLoader(false);
      setShowProductUI(true);
    }
  };

  return (
    <>
      <div
        id="cashfree-dropin"
        style={{
          width: "100%",
          height: showProductUI ? "0" : "auto",
          display: showProductUI ? "none" : "block",
          display: "flex",
          justifyContent: "center",
          overflow: "hidden",
        }}
      />

      {showProductUI && (
        <>
          <div className={styles.container}>
            <ToastContainer position="top-right" autoClose={2000} />

            {/* Header Icons */}
            <div className={styles.back} onClick={() => router.back()}>
              <ChevronLeft size={30} />
            </div>
            <div className={styles.mobileIconsContainer}>
              <div className={styles.mobileIconsRight}>
                <button
                  className={styles.mobileIcon}
                  onClick={() => router.push("/cart")}
                >
                  {cartCount > 0 && (
                    <span className={styles.badge}>{cartCount}</span>
                  )}
                  <Image src={bag} alt="bag" />
                </button>
                <button
                  className={styles.mobileIcon}
                  onClick={handleWishlistClick}
                >
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

            {product?.isCustomizable ? (
              <ShirtEditor
                product={product}
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
              />
            ) : (
              <Image
                src={product?.productImages[0]}
                alt="product"
                width={500}
                height={600}
                className={styles.mainImage}
                priority
              />
            )}

            {/* Info Section */}
            <div
              className={`${styles.infoSection} ${
                !isCustomizable && styles.infoSection_img
              }`}
            >
              <div className={styles.priceSection}>
                <h1>{product?.name}</h1>
              </div>
              <div className={styles.dis_price}>
                <p className={styles.discountedPrice}>
                  ₹ {product?.discountedPrice}
                </p>
                <p className={styles.basePrice}>₹ {product?.basePrice}</p>
                {product?.discountedPrice && product?.basePrice && (
                  <span className={styles.offerTag}>
                    {Math.round(
                      ((product.basePrice - product.discountedPrice) /
                        product.basePrice) *
                        100
                    )}
                    % OFF
                  </span>
                )}
              </div>

              {/* Size Selection */}
              {product?.configuration?.[0]?.options?.length > 0 && (
                <div className={styles.sizes}>
                  <h4>SELECT SIZE</h4>
                  {sizeInfo && (
                    <div className={styles.sizeDetailsBox}>
                      <span>Chest: {sizeInfo?.options[0]?.value} cm</span>
                      <span>Length: {sizeInfo?.options[1]?.value} cm</span>
                      {sizeInfo?.options.length > 2 && (
                        <span>Sleeves: {sizeInfo?.options[2]?.value} cm</span>
                      )}
                    </div>
                  )}
                  <div className={styles.sizeOptions}>
                    {product?.configuration[0].options.map((s) => (
                      <button
                        key={s.value}
                        className={`${styles.sizeBtn} ${
                          selectedSize === s.value ? styles.activeSize : ""
                        }`}
                        onClick={() => handleSizeSelect(s.value)}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className={styles.button_wrapper}>
                <button className={styles.buyit_btn} onClick={handlePayNow}>
                  {"BUY IT NOW"}
                  <p>(click to select size)</p>
                </button>
                <button
                  className={styles.addToCart}
                  onClick={addToCart}
                  disabled={loader}
                >
                  {loader ? "ADDING..." : "ADD TO BAG"}
                  <p>(click to select size)</p>
                </button>
              </div>

              {/* Details Accordion */}
              <div className={styles.accordion}>
                {[
                  { title: "DETAILS", content: product?.description },
                  { title: "CARE", content: product?.care },
                ].map((item, i) => (
                  <div
                    key={i}
                    className={styles.accordionItem}
                    onClick={() =>
                      setActiveSection(activeSection === i ? null : i)
                    }
                  >
                    <div className={styles.accordionHeader}>
                      <h3>{item.title}</h3>
                      {activeSection === i ? (
                        <Minus size={20} />
                      ) : (
                        <Plus size={20} />
                      )}
                    </div>
                    <div
                      className={`${styles.accordionContent} ${
                        activeSection === i ? styles.active : ""
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
                  {product?.configuration?.[0]?.options.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => {
                        handleSizeSelect(s.value, true);
                        setShowSizeSheet(false);
                      }}
                      className={`${styles.sizeBtn} ${
                        selectedSize === s.value ? styles.activeSize : ""
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
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
            </div>
          </div>

          <section style={{ width: "100%", overflowX: "auto" }}>
            <Suggested relatedData={relatedData} />
          </section>
        </>
      )}
    </>
  );
};

export default ProductDetails;
