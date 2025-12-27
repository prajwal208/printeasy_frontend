"use client";
import React, { useEffect, useState } from "react";
import { Trash2, ChevronLeft } from "lucide-react";
import styles from "./cart.module.scss";
import NoResult from "@/component/NoResult/NoResult";
import { useRouter } from "next/navigation";
import CartRewards from "./CartRewards/CartRewards";
import DefaultAddress from "./DefaultAddress/DefaultAddress";
import PriceList from "./PriceList/PriceList";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from "@/axiosInstance/axiosInstance";
import { db } from "@/lib/db";
import Cookies from "js-cookie";
import { load } from "@cashfreepayments/cashfree-js";
import DynamicModal from "@/component/Modal/Modal";
import LoginForm from "../signup/LogIn/LoginForm";

const Cart = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const [cartItems, setCartItems] = useState([]);
  const [addressList, setAddressList] = useState([]);
  const [offerData, setOfferData] = useState([]);
  const [cashfree, setCashfree] = useState(null);
  const router = useRouter();
  const accessToken = Cookies.get("idToken");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoginModalVisible, setIsLoginModalVisible] = useState(false);

  // useEffect(() => {
  //   const token = Cookies.get("idToken");
  //   setIsLoggedIn(!!token);
  // }, []);

  const handleContinue = () => {
    setIsLoginModalVisible(false);
    setIsLoggedIn(true);
  };

  useEffect(() => {
    const initCashfree = async () => {
      const cf = await load({
        mode: "production",
      });
      setCashfree(cf);
    };
    initCashfree();
  }, []);

  useEffect(() => {
    db.cart.toArray().then(setCartItems);
    getAddressList();
    getOfferData();
  }, []);

  const handleQuantityChange = async (id, newQuantity) => {
    if (newQuantity < 1) return;
    await db.cart.update(id, { quantity: newQuantity });
    const updatedCart = await db.cart.toArray();
    setCartItems(updatedCart);
  };

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => {
      const price = Number(item.discountPrice) || 0;
      const qty = Number(item.quantity) || 1;
      return sum + price * qty;
    }, 0);
  };

  const bagTotal = calculateTotal();
  const couponDiscount = 0;
  const grandTotal = bagTotal - couponDiscount;

  console.log(grandTotal);

  const removeFromCart = async (productId) => {
    try {
      const item = await db.cart.where("productId").equals(productId).first();
      if (!item) return;
      await db.cart.delete(item.id);
      setCartItems((prev) => prev.filter((i) => i.productId !== productId));
      toast.success("Item removed");
    } catch (err) {
      toast.error("Failed to remove item");
    }
  };

  const getAddressList = async () => {
    try {
      const res = await api.get(`/v1/address/all`, {
        headers: {
          "x-api-key":
            "454ccaf106998a71760f6729e7f9edaf1df17055b297b3008ff8b65a5efd7c10",
        },
      });
      setAddressList(res?.data?.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const getOfferData = async () => {
    try {
      const res = await api.get(`/v2/giftreward`, {
        headers: {
          "x-api-key":
            "454ccaf106998a71760f6729e7f9edaf1df17055b297b3008ff8b65a5efd7c10",
        },
      });
      setOfferData(res?.data?.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  // ----------------- Cashfree Integration -----------------
  const handlePayNow = async () => {
    if (cartItems.length === 0) {
      toast.warning("Your cart is empty!");
      return;
    }

    try {
      const res = await api.post(
        "/v1/orders/create",
        {
          // shippingAddressId: addressList[0].id,
          // billingAddressId: addressList[0].id,
          paymentMethod: "ONLINE",
          totalAmount: grandTotal,
          items: [
            {
              name: "Product Name",
              sku: "SKU123",
              totalPrice: grandTotal,
              quantity: 2,
              categoryId: "H8SZ4VfsFXa4C9cUeonB",
              isCustomizable: false,
              discount: 0,
              tax: 12,
              hsn: 482090,
            },
          ],
        },
        {
          headers: {
            "x-api-key":
              "454ccaf106998a71760f6729e7f9edaf1df17055b297b3008ff8b65a5efd7c10",
          },
        }
      );

      const orderData = res?.data?.data;
      localStorage.setItem("pendingOrderId", orderData.orderId);
      localStorage.setItem(
        "pendingCashfreeOrderId",
        orderData.cashfree.orderId
      );
      localStorage.setItem("pendingOrderAmount", String(grandTotal));
      console.log("Order response:", orderData?.cashfree?.sessionId);

      const paymentSessionId = orderData?.cashfree?.sessionId;

      if (!paymentSessionId) {
        toast.error("Payment session not generated");
        return;
      }

      const checkoutOptions = {
        paymentSessionId,
        container: "#cashfree-dropin",
      };

      cashfree.checkout(checkoutOptions).then((result) => {
        if (result.error) {
          toast.error(result.error.message);
        }
        if (result.redirect) {
          console.log("Payment redirection in progress");
        }
      });
    } catch (error) {
      console.error("Cashfree error:", error);
      toast.error("Failed to initiate payment.");
    }
  };

  const addToWishlist = async (productId) => {
    if (!accessToken) {
      toast.warning("Please login to Add to Wishlist");
      return;
    }
    try {
      await api.post(
        `${apiUrl}/v2/wishlist`,
        { productId },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "x-api-key": process.env.NEXT_PUBLIC_API_KEY,
          },
        }
      );
      toast.success("Added to wishlist!");
    } catch (error) {
      toast.error("Failed to add to wishlist");
    }
  };

  return (
    <div className={styles.cartPage}>
      <div id="cashfree-dropin"></div>
      <ToastContainer position="top-right" autoClose={2000} />
      {cartItems?.length > 0 ? (
        <>
          <button className={styles.iconBtn} onClick={() => router.push("/")}>
            <ChevronLeft size={22} />
          </button>
          <CartRewards totalAmount={bagTotal} />

          <div className={styles.cartContainer}>
            <div className={styles.cartItems}>
              {cartItems.map((item) => (
                <div key={item.id} className={styles.cartItem}>
                  <div className={styles.itemImage}>
                    <img src={item.productImageUrl} alt={item.name} />
                  </div>

                  <div className={styles.itemDetails}>
                    <div className={styles.itemHeader}>
                      <h3 className={styles.itemName}>{item.name}</h3>
                      <button
                        onClick={() => removeFromCart(item?.productId)}
                        className={styles.removeBtn}
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>

                    <div className={styles.itemMeta}>
                      <span>{item.options?.[0]?.value} |</span>
                      <span className={styles.quantitySelector}>
                        QTY |
                        <select
                          value={item.quantity}
                          onChange={(e) =>
                            handleQuantityChange(
                              item.id,
                              parseInt(e.target.value)
                            )
                          }
                        >
                          {[...Array(10).keys()].map((num) => (
                            <option key={num + 1} value={num + 1}>
                              {num + 1}
                            </option>
                          ))}
                        </select>
                      </span>
                    </div>

                    <div className={styles.itemFooter}>
                      <button
                        className={styles.wishlistBtn}
                        onClick={() => addToWishlist(item?.productId)}
                      >
                        MOVE TO WISHLIST
                      </button>
                      <span className={styles.itemPrice}>
                        <span className={styles.strikeValue}>
                          ₹{item?.basePrice}
                        </span>{" "}
                        <span>₹{item?.discountPrice}</span>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.rightSection}>
              <DefaultAddress
                addressList={addressList}
                onChange={() => router.push("/address")}
              />
              <PriceList
                bagTotal={bagTotal}
                grandTotal={grandTotal}
                handlePayNow={handlePayNow}
                offerData={offerData}
              />
            </div>
          </div>

          <DynamicModal
            open={isLoginModalVisible}
            onClose={() => setIsLoginModalVisible(false)}
          >
            <LoginForm
              onContinue={handleContinue}
              setIsLoginModalVisible={setIsLoginModalVisible}
              setIsLoggedIn={setIsLoggedIn}
            />
          </DynamicModal>
        </>
      ) : (
        <NoResult
          title="Oops! Your Cart is Empty"
          description="Explore our products and find the perfect items for you."
          buttonText="Explore"
          onButtonClick={() => router.push("/")}
        />
      )}
    </div>
  );
};

export default Cart;
