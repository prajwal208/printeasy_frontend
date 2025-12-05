"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Plus, Minus, Heart } from "lucide-react";
import Image from "next/image";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Cookies from "js-cookie";
import { db } from "@/lib/db";
import styles from "./ProductDetails.module.scss";
import CanvasEditor from "@/component/CanvasEditor/CanvasEditor";
import api from "@/axiosInstance/axiosInstance";
import AddToBagLoader from "@/component/AddToBagLoader/AddToBagLoader";
import DynamicModal from "@/component/Modal/Modal";
import ProductDetailsShimmer from "@/component/ProductDetailsShimmer/ProductDetailsShimmer";
import Suggested from "@/component/Suggested/Suggested";

const ProductDetails = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true); // initially true
  const [activeSection, setActiveSection] = useState(null);
  const [designPng, setDesignPng] = useState("");
  const [sizeInfo, setSizeInfo] = useState(null);
  const [count, setCount] = useState(null);
  const [printingImg, setPrintingImg] = useState({
    textColor: "",
    fontFamily: "",
    printText: "",
    fontSize: "",
  });
  const [relatedId, setRelatedId] = useState("");
  const [loader, setLoader] = useState(false);
  const [relatedData, setRelatedData] = useState([]);

  console.log(sizeInfo?.options.length, "uuuttt");

  const accessToken = Cookies.get("idToken");

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await api.get(`/v2/product/${id}`, {
          headers: {
            "x-api-key":
              "454ccaf106998a71760f6729e7f9edaf1df17055b297b3008ff8b65a5efd7c10",
          },
        });
        setProduct(res?.data?.data);
        setRelatedId(res?.data?.data?.id);
      } catch (error) {
        console.error("Error fetching product:", error);
        toast.error("Failed to fetch product.");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProduct();
  }, [id]);

  useEffect(() => {
    if (relatedId) {
      getRelatedProduct(relatedId);
    }
  }, [relatedId]);

  if (loading && !product) {
    return <ProductDetailsShimmer />;
  }

  const addToCart = async () => {
    if (product?.configuration?.length > 0 && !selectedSize) {
      toast.warning("Please select a size.");
      return;
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
      productImageUrl: product.productImages?.[0] || product.canvasImage || "",
      dimensions: {
        length: product.dimension?.length || 0,
        width: product.dimension?.width || 0,
        height: product.dimension?.height || 0,
        weight: product.dimension?.weight || 0,
      },
      options: [
        {
          label: "Size",
          value: selectedSize,
        },
      ],
      addedAt: new Date().toISOString(),
    };

    try {
      setLoader(true);
      setLoading(true);

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
        });
      } else {
        await db.cart.add(payload);
      }

      toast.success("Added to cart!");
    } catch (err) {
      console.error("Dexie error:", err);
      toast.error("Failed to add to cart");
    } finally {
      setLoader(false);
      setLoading(false);
    }
  };


  const addToWishlist = async () => {
    if (!accessToken) {
      toast.warning("Please login to Add to Wishlist");
      return;
    }

    try {
      const res = await api.post(
        `${apiUrl}/v2/wishlist`,
        { productId: product.id },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "x-api-key":
              "454ccaf106998a71760f6729e7f9edaf1df17055b297b3008ff8b65a5efd7c10",
          },
        }
      );

      if (res.status === 200) toast.success("Added to wishlist!");
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to add to wishlist"
      );
    }
  };

  const handleDesignChange = (designDataURL) => setDesignPng(designDataURL);

  const handleSizeSelect = (size) => {
    setSelectedSize(size);
    const match = product?.configuration[0]?.options.find(
      (item) => item.value === size
    );
    setSizeInfo(match || null);
  };

  const getRelatedProduct = async (relatedId) => {
    try {
      const res = await api.get(`/v2/product/${relatedId}/related`, {
        headers: {
          "x-api-key":
            "454ccaf106998a71760f6729e7f9edaf1df17055b297b3008ff8b65a5efd7c10",
        },
      });
      setRelatedData(res?.data?.data);
      console.log(res, "pposueueuuexxxncbcbc");
      return res; // <-- as requested
    } catch (error) {
      console.log(error, "error while fetching related data");
      return null; // safe return for failure
    }
  };

  return (
    <div className={styles.container}>
      <ToastContainer position="top-right" autoClose={2000} />

      {product?.isCustomizable ? (
        <CanvasEditor
          product={product}
          onDesignChange={handleDesignChange}
          setPrintingImg={setPrintingImg}
          addToWishlist={addToWishlist}
        />
      ) : (
        <Image
          src={product?.canvasImage}
          alt="product"
          width={500}
          height={600}
          className={styles.mainImage}
        />
      )}

      <div className={styles.infoSection}>
        {/* <p className={styles.subtitle}>{product?.subtitle}</p> */}
        <div className={styles.priceSection}>
          <h1>{product?.name}</h1>
        </div>
        <div className={styles.dis_price}>
          <p className={styles.discountedPrice}>₹ {product?.discountedPrice}</p>
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

        {product?.configuration?.[0]?.options?.length > 0 && (
          <div className={styles.sizes}>
            <h4>SELECT SIZE</h4>
            {sizeInfo && (
              <div className={styles.sizeDetailsBox}>
                <span>Chest: {sizeInfo?.options[0]?.value} cm</span>
                <span>Length: {sizeInfo?.options[1]?.value} cm</span>
                {sizeInfo?.options.length > 2 && (
                  <span>Sleeves Length: {sizeInfo?.options[2]?.value} cm</span>
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

        <div className={styles.buttonsWrapper}>
          <button
            className={styles.addToCart}
            onClick={addToCart}
            disabled={loading}
          >
            {loading ? "ADDING..." : "ADD TO BAG"}
          </button>

          {/* <button className={styles.addToWishlist} onClick={addToWishlist}>
            <Heart size={18} style={{ marginRight: "6px" }} />
            WISHLIST
          </button> */}
        </div>
        <div className={styles.accordion}>
          {[
            { title: "DETAILS", content: product?.description },
            { title: "CARE", content: product.care },
          ].map((item, i) => (
            <div
              key={i}
              className={styles.accordionItem}
              onClick={() => setActiveSection(activeSection === i ? null : i)}
            >
              <div className={styles.accordionHeader}>
                <h3>{item.title}</h3>
                {activeSection === i ? <Minus size={20} /> : <Plus size={20} />}
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

        <section>
          <Suggested relatedData={relatedData} />
        </section>
      </div>

      <DynamicModal open={loader} onClose={() => setLoader(false)}>
        <AddToBagLoader />
      </DynamicModal>
    </div>
  );
};

export default ProductDetails;
