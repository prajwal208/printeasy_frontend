"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { nanoid } from "nanoid";
import { Plus, Minus, Heart } from "lucide-react";
import Image from "next/image";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import styles from "./ProductDetails.module.scss";
import CanvasEditor from "@/component/CanvasEditor/CanvasEditor";
import api from "@/axiosInstance/axiosInstance";

const ProductDetails = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState(null);
  const [designPng, setDesignPng] = useState("");
  const [printingImg, setPrintingImg] = useState({
    textColor: "",
    fontFamily: "",
    printText: "",
    fontSize: "",
  });

  console.log(product,"jjshshsbvvvc")

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/v2/product/${id}`, {
          headers: {
            "x-api-key":
              "454ccaf106998a71760f6729e7f9edaf1df17055b297b3008ff8b65a5efd7c10",
          },
        });
        setProduct(res?.data?.data);
      } catch (error) {
        console.error("Error fetching product:", error);
        toast.error("Failed to fetch product.");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProduct();
  }, [id, apiUrl]);

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
          id: "",
          label: "Size",
          value: "size",
          options:
            product.configuration?.[0]?.options
              ?.filter((opt) => opt.value === selectedSize)
              .map((opt) => ({
                id: "",
                label: opt.label,
                value: opt.value,
                options: opt.options || [],
              })) || [],
        },
      ],
      illustrationImage: product?.illustrationImage,
      printingImgText: printingImg,
    };

    try {
      setLoading(true);
      const res = await api.post(`${apiUrl}/v1/cart`, payload, {
        headers: {
          "x-api-key":
            "454ccaf106998a71760f6729e7f9edaf1df17055b297b3008ff8b65a5efd7c10",
        },
      });
      if (res.status === 200) toast.success("Added to bag!");
    } catch (err) {
      console.error("❌ Error adding to cart:", err);
      toast.error(err?.response?.data?.message || "Failed to add to bag");
    } finally {
      setLoading(false);
    }
  };

  const addToWishlist = async () => {
    try {
      const res = await api.post(
        `${apiUrl}/v2/wishlist`,
        { productId: product.id },
        {
          headers: {
            "x-api-key":
              "454ccaf106998a71760f6729e7f9edaf1df17055b297b3008ff8b65a5efd7c10",
          },
        }
      );
      if (res.status === 200) toast.success("Added to wishlist!");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to add to wishlist");
    }
  };

  const handleDesignChange = (designDataURL) => {
    setDesignPng(designDataURL);
  };

  if (loading && !product) {
    return (
      <div className={styles.shimmerWrapper}>
        <div className={styles.shimmer}></div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <ToastContainer position="top-right" autoClose={2000} />
      {product?.isCustomizable ? (
        <CanvasEditor
          product={product}
          onDesignChange={handleDesignChange}
          setPrintingImg={setPrintingImg}
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
        <h1>{product?.name}</h1>
        <p className={styles.subtitle}>{product?.subtitle}</p>

        <div className={styles.priceSection}>
          {product?.discountedPrice ? (
            <>
              <p className={styles.discountedPrice}>
                ₹ {product?.discountedPrice}
              </p>
              <p className={styles.basePrice}>₹ {product?.basePrice}</p>
            </>
          ) : (
            <p className={styles.price}>₹ {product?.basePrice}</p>
          )}
        </div>

        {product?.configuration?.[0]?.options?.length > 0 && (
          <div className={styles.sizes}>
            <h4>Sizes</h4>
            <div className={styles.sizeOptions}>
              {product?.configuration[0].options.map((s) => (
                <button
                  key={s.value}
                  className={`${styles.sizeBtn} ${
                    selectedSize === s.value ? styles.activeSize : ""
                  }`}
                  onClick={() => setSelectedSize(s.value)}
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
          <button className={styles.addToWishlist} onClick={addToWishlist}>
            <Heart size={18} style={{ marginRight: "6px" }} />
            WISHLIST
          </button>
        </div>

        <div className={styles.accordion}>
          {[
            { title: "DETAILS", content: product?.description },
            { title: "CARE", content: product?.care },
          ].map((sec) => (
            <div key={sec.title} className={styles.accordionItem}>
              <div
                className={styles.accordionHeader}
                onClick={() =>
                  setActiveSection(
                    activeSection === sec.title ? null : sec.title
                  )
                }
              >
                <h3>{sec.title}</h3>
                {activeSection === sec.title ? <Minus /> : <Plus />}
              </div>
              <div
                className={`${styles.accordionContent} ${
                  activeSection === sec.title ? styles.active : ""
                }`}
              >
                <p>{sec.content || "No information available."}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
