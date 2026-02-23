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
import { createSlug } from "@/app/helper";
import ProductSchema from "@/component/seo/ProductSchema";
import ProductPixel from "@/component/seo/ProductPixel";
import YouMayLikeSection from "@/component/YouMayLikeSection/YouMayLikeSection";
import { ChevronUp } from "lucide-react";

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
      setShowSuccessCart(true);

      console.log("✅ Item added to cart successfully");
    } catch (err) {
      console.error("❌ Dexie error:", err);
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

  console.log(product?.configuration[0].options, "sososppyyttttt");

  useEffect(() => {
    setEditorReady(false);
  }, [id]);

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

  if (loading) {
    return <ProductDetailsShimmer />;
  }

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
        return;
      }

      localStorage.setItem("pendingOrderId", backendOrderId);
      localStorage.setItem("pendingCashfreeOrderId", cashfreeOrderId);
      localStorage.setItem("pendingOrderAmount", product?.discountedPrice);

      // setShowProductUI(false);

      const cashfree = await load({ mode: "production" });
      cashfree.checkout({
        paymentSessionId,
        redirect: true,
      });
      // cashfree
      //   .checkout({
      //     paymentSessionId,
      //     redirectTarget: true,
      //   })
      //   .then((result) => {
      //     if (result?.paymentDetails) {
      //       window.location.href = `/order-redirect?order_id=${cashfreeOrderId}`;
      //     } else if (result?.error) {
      //       toast.error("Payment failed");
      //       // setShowProductUI(true);
      //     }
      //   });
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
            <>
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
                onReady={() => setEditorReady(true)}
              />
            </>
          ) : (
            <Image
              src={product?.productImages[0]}
              alt="product"
              width={500}
              height={600}
              className={styles.mainImage}
              priority
              onLoad={() => setEditorReady(true)}
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
                    {sizeInfo.options?.find((opt) => opt.label === "Chest")
                      ?.value && (
                      <span>
                        Chest:{" "}
                        {
                          sizeInfo.options.find((opt) => opt.label === "Chest")
                            .value
                        }{" "}
                        cm
                      </span>
                    )}

                    {sizeInfo.options?.find((opt) => opt.label === "Length")
                      ?.value && (
                      <span>
                        Length:{" "}
                        {
                          sizeInfo.options.find((opt) => opt.label === "Length")
                            .value
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
                  {product?.configuration[0].options.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => handleSizeSelect(s.value)}
                      className={`${styles.sizeBtn} ${
                        selectedSizeYear === s.value ? styles.activeSize : ""
                      }`}
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
                <div
                  className={styles.offerBanner}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowOfferSheet(true);
                  }}
                >
                  <div className={styles.offerIcon}>
                    Offers <ChevronUp size={14} />
                  </div>
                </div>
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
                    onClick={() => handleSizeSelect(s.value)}
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

            <BottomSheet
              open={showOfferSheet}
              onClose={() => setShowOfferSheet(false)}
            >
              <div className={styles.offerSheet}>
                <h3>Available Offers</h3>

                {offers?.map((item) => (
                  <div key={item.id} className={styles.offerCard}>
                    {/* <div className={styles.offerEmoji}>🎁</div> */}

                    <div className={styles.offerlist}>
                      <p className={styles.offerCardTitle}>{item.title}</p>

                      <span className={styles.offerMin}>
                        <strong>Min Order ₹{item.minOrderAmount}</strong>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </BottomSheet>
          </div>
        </div>

        <section
          style={{ width: "100%", overflowX: "auto", marginTop: "16px" }}
        >
          {collectionId ? (
            <YouMayLikeSection categoryId={collectionId} />
          ) : (
            <Suggested relatedData={relatedData} />
          )}
        </section>
      </>
    </>
  );
};

export default ProductDetails;
