"use client";
import React, { useEffect, useState } from "react";
import { Trash2, ChevronLeft, Zap } from "lucide-react";
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
import axios from "axios";

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
  const [hasSavedAddress, setHasSavedAddress] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [user, setUser] = useState(null);

  // Check if user has saved address for one-click checkout

  // useEffect(() => {
  //   const initCashfree = async () => {
  //     try {
  //       // Check if window.Cashfree is available (from the script tag)
  //       if (window.Cashfree) {
  //         const cf = window.Cashfree;
  //         setCashfree(cf);
  //         console.log("Cashfree SDK loaded from window object");
  //       } else {
  //         // Fallback: try to load via npm package
  //         const cf = await load({
  //           mode: "production",
  //         });
  //         setCashfree(cf);
  //         console.log("Cashfree SDK loaded via import");
  //       }
  //     } catch (error) {
  //       console.error("Failed to initialize Cashfree:", error);
  //       toast.error("Payment system not available. Please refresh the page.");
  //     }
  //   };

  //   // Only run on client side - this effect will not run on server
  //   if (window.Cashfree) {
  //     initCashfree();
  //   } else {
  //     // Wait for the script to load
  //     const checkCashfree = setInterval(() => {
  //       if (window.Cashfree) {
  //         initCashfree();
  //         clearInterval(checkCashfree);
  //       }
  //     }, 100);

  //     // Stop checking after 5 seconds
  //     setTimeout(() => clearInterval(checkCashfree), 5000);
  //     db.cart.toArray().then(setCartItems);
  //     getAddressList();
  //     getOfferData();
  //   }
  //   // Get user data if logged in
  //   if (accessToken) {
  //     // getUserData();
  //   }
  // }, [accessToken]);

  // useEffect(() => {
  //   const initCashfree = async () => {
  //     try {
  //       let cf;

  //       // Check if window.Cashfree is available (from the script tag)
  //       if (window.Cashfree) {
  //         // Initialize Cashfree with configuration
  //         cf = await window.Cashfree.init({
  //           mode: "production", // or "sandbox" for testing
  //         });
  //         console.log("Cashfree SDK loaded from window object");
  //       } else {
  //         // Fallback: try to load via npm package
  //         cf = await load({
  //           mode: "production",
  //         });
  //         console.log("Cashfree SDK loaded via import");
  //       }

  //       setCashfree(cf);
  //     } catch (error) {
  //       console.error("Failed to initialize Cashfree:", error);
  //       toast.error("Payment system not available. Please refresh the page.");
  //     }
  //   };

  //   // Only initialize after component mounts (client-side only)
  //   if (typeof window !== "undefined") {
  //     // Wait for the script to load if not already available
  //     if (window.Cashfree) {
  //       initCashfree();
  //     } else {
  //       const checkCashfree = setInterval(() => {
  //         if (window.Cashfree) {
  //           initCashfree();
  //           clearInterval(checkCashfree);
  //         }
  //       }, 100);

  //       // Stop checking after 5 seconds
  //       setTimeout(() => {
  //         clearInterval(checkCashfree);
  //         if (!window.Cashfree) {
  //           toast.error("Failed to load payment system. Please refresh.");
  //         }
  //       }, 5000);
  //     }

  //     // Load cart items and other data
  //     db.cart.toArray().then(setCartItems);
  //     getAddressList();
  //     getOfferData();
  //   }

  //   // Get user data if logged in
  //   if (accessToken) {
  //     // getUserData();
  //   }
  // }, [accessToken]);

  useEffect(() => {
    const initCashfree = async () => {
      try {
        let cf;

        if (typeof window !== "undefined" && window.Cashfree) {
          console.log("Window.Cashfree detected:", window.Cashfree);

          // Try different initialization methods
          try {
            // Method 1: Check if Cashfree is already initialized
            if (typeof window.Cashfree === "function") {
              cf = window.Cashfree({ mode: "production" });
            }
            // Method 2: Check if it has an init method
            else if (window.Cashfree.init) {
              cf = await window.Cashfree.init({ mode: "production" });
            }
            // Method 3: Use it directly if it's already an instance
            else {
              cf = window.Cashfree;
            }

            console.log("Cashfree initialized successfully:", cf);
            setCashfree(cf);
          } catch (initError) {
            console.error("Cashfree initialization error:", initError);

            // Fallback: try npm package
            console.log("Attempting fallback to npm package...");
            cf = await load({ mode: "production" });
            console.log("Cashfree loaded via npm package");
            setCashfree(cf);
          }
        } else {
          // No window.Cashfree, use npm package
          console.log("Loading Cashfree via npm package...");
          cf = await load({ mode: "production" });
          console.log("Cashfree SDK loaded via import");
          setCashfree(cf);
        }
      } catch (error) {
        console.error("Failed to initialize Cashfree:", error);
        toast.error("Payment system not available. Please refresh the page.");
      }
    };

    // Only initialize after component mounts (client-side only)
    if (typeof window !== "undefined") {
      // Small delay to ensure DOM and scripts are fully loaded
      const initTimer = setTimeout(() => {
        if (window.Cashfree) {
          console.log("Cashfree script found, initializing...");
          initCashfree();
        } else {
          console.log("Waiting for Cashfree script to load...");

          let attempts = 0;
          const maxAttempts = 50; // 5 seconds total

          const checkCashfree = setInterval(() => {
            attempts++;

            if (window.Cashfree) {
              
              initCashfree();
              clearInterval(checkCashfree);
            } else if (attempts >= maxAttempts) {
              clearInterval(checkCashfree);
              console.error("Cashfree script failed to load after 5 seconds");

              // Try loading via npm as final fallback
              console.log("Final fallback: Loading via npm package...");
              load({ mode: "production" })
                .then((cf) => {
                  console.log("Cashfree loaded via npm fallback");
                  setCashfree(cf);
                })
                .catch((err) => {
                  console.error("All Cashfree loading methods failed:", err);
                  toast.error("Failed to load payment system. Please refresh.");
                });
            }
          }, 100);
        }
      }, 100); // Small initial delay

      // Load cart items and other data
      db.cart.toArray().then(setCartItems).catch(console.error);

      if (accessToken) {
        getAddressList();
      }

      getOfferData();

      return () => clearTimeout(initTimer);
    }
  }, [accessToken]);

  useEffect(() => {
    if (addressList && addressList.length > 0) {
      setHasSavedAddress(true);
    } else {
      setHasSavedAddress(false);
    }
  }, [addressList]);

  // const getUserData = async () => {
  //   try {
  //     const res = await api.get("/v1/user", {
  //       headers: {
  //         Authorization: Bearer ${accessToken},
  //         "x-api-key": process.env.NEXT_PUBLIC_API_KEY,
  //       },
  //     });
  //     setUser(res?.data?.data || null);
  //   } catch (error) {
  //     console.error("Error fetching user data:", error);
  //   }
  // };

  const handleContinue = () => {
    setIsLoginModalVisible(false);
    setIsLoggedIn(true);
  };

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
      const res = await api.get("/v1/address/all", {
        headers: {
          "x-api-key": "454ccaf106998a71760f6729e7f9edaf1df17055b297b3008ff8b65a5efd7c10"
        },
      });
      setAddressList(res?.data?.data || []);
    } catch (error) {
      console.error("Error fetching addresses:", error);
      setAddressList([]);
    }
  };

  const getOfferData = async () => {
    try {
      const res = await api.get("/v2/giftreward", {
        headers: {
          "x-api-key": process.env.NEXT_PUBLIC_API_KEY,
        },
      });
      setOfferData(res?.data?.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  // One-Click Checkout Handler - Cashfree collects address
  const handleOneClickCheckout = async () => {
    const token = Cookies.get("idToken");
    if (!token) {
      setIsLoginModalVisible(true);
      return;
    }

    if (cartItems.length === 0) {
      toast.warning("Your cart is empty!");
      return;
    }

    setIsProcessing(true);
    try {
      const items = cartItems.map((item) => ({
        productId: item.productId,
        name: item.name,
        sku: item.sku,
        totalPrice: Number(item.discountPrice),
        price: Number(item.discountPrice),
        quantity: Number(item.quantity),
        categoryId: "H8SZ4VfsFXa4C9cUeonB",
        isCustomizable: item.isCustomizable || false,
        discount: 0,
        tax: 0,
        hsn: item.hsn || "482090",
        // productImageUrl: item.productImageUrl,
        // imageUrl: item.productImageUrl,
        // renderedImageUrl: item.renderedImageUrl,
      }));

      // Calculate total amount with convenience fee
      let totalAmount = items.reduce(
        (sum, item) => sum + item.totalPrice * item.quantity,
        0
      );

      // Add convenience fee for orders below 500
      if (totalAmount < 500) {
        totalAmount = Number((totalAmount + 50).toFixed(2));
      }

      // ✅ ONE-CLICK CHECKOUT: Use dedicated endpoint and pass totalAmount
      const res = await api.post("/v1/orders/one-click-checkout",
        {
          items,
          totalAmount,
          // No address needed - Cashfree will collect it
        },
        {
          headers: {
           "x-api-key": "454ccaf106998a71760f6729e7f9edaf1df17055b297b3008ff8b65a5efd7c10"
          },
        }
      );

      const orderData = res?.data?.data || {};
      const paymentSessionId = orderData.cashfree?.sessionId;
      const orderId = orderData.orderId;
      const cashfreeOrderId = orderData.cashfree?.orderId;

      console.log("One-click order creation response:", {
        orderData,
        paymentSessionId,
        orderId,
        cashfreeOrderId,
        cashfreeObject: !!cashfree,
      });

      if (!paymentSessionId) {
        console.error("Missing payment session:", orderData);
        toast.error("Failed to create payment session. Please try again.");
        setIsProcessing(false);
        return;
      }

      if (!cashfree) {
        console.error("Cashfree SDK not loaded");
        toast.error("Payment system not ready. Please refresh the page.");
        setIsProcessing(false);
        return;
      }

      // Store order info for verification
      localStorage.setItem("pendingOrderId", orderId);
      localStorage.setItem("pendingCashfreeOrderId", cashfreeOrderId);
      localStorage.setItem("grandTotal", totalAmount.toString());

      console.log(
        "Initializing Cashfree one-click checkout with session:",
        paymentSessionId
      );

      // Initialize Cashfree checkout - Cashfree will show address collection form
      const result = await cashfree.checkout({
        paymentSessionId: paymentSessionId,
        redirectTarget: "_self",
      });

      console.log("Cashfree one-click checkout result:", result);

      if (result?.error) {
        console.error("Cashfree checkout error:", result.error);
        toast.error("Payment initialization failed. Please try again.");
        setIsProcessing(false);
      } else if (!result?.redirect) {
        console.warn("Checkout may not have redirected properly", result);
        // Still allow the redirect to happen naturally
      }
    } catch (error) {
      console.error("One-click checkout error:", error);
      toast.error(
        error.response?.data?.message ||
          "One-click checkout failed. Please try normal checkout."
      );
      setIsProcessing(false);
    }
  };

  // Normal Checkout Handler - Can send address or let Cashfree collect
  const handlePayNow = async () => {
    const token = Cookies.get("idToken");
    if (!token) {
      setIsLoginModalVisible(true);
      return;
    }

    if (cartItems.length === 0) {
      toast.warning("Your cart is empty!");
      return;
    }

    setIsProcessing(true);
    try {
      const items = cartItems.map((item) => ({
        productId: item.productId,
        name: item.name,
        sku: item.sku,
        totalPrice: Number(item.discountPrice),
        price: Number(item.discountPrice),
        quantity: Number(item.quantity),
        categoryId:"H8SZ4VfsFXa4C9cUeonB",
        isCustomizable: item.isCustomizable || false,
        discount: 0,
        tax: 0,
        hsn: item.hsn || "482090",
        // productImageUrl: item.productImageUrl,
        // imageUrl: item.productImageUrl,
        // renderedImageUrl: item.renderedImageUrl,
      }));

      // Calculate total amount with convenience fee
      let totalAmount = items.reduce(
        (sum, item) => sum + item.totalPrice * item.quantity,
        0
      );

      // Add convenience fee for orders below 500
      if (totalAmount < 500) {
        totalAmount = Number((totalAmount + 50).toFixed(2));
      }

      // Normal checkout: Can send address if available, or let Cashfree collect
      const defaultAddress =
        addressList.find((addr) => addr.isDefault) || addressList[0];

      const res = await api.post(
        "/v1/orders/create",
        {
          shippingAddressId: defaultAddress?.id || null,
          billingAddressId: defaultAddress?.id || null,
          paymentMethod: "ONLINE",
          items,
          totalAmount,
          // If no address, send user data
          ...(!defaultAddress && {
            user: user || {
              name: "Customer",
              email: "",
              phone: "",
            },
          }),
        },
        {
          headers: {
           "x-api-key": "454ccaf106998a71760f6729e7f9edaf1df17055b297b3008ff8b65a5efd7c10"
          },
        }
      );

      const orderData = res?.data?.data || {};
      const paymentSessionId = orderData.cashfree?.sessionId;
      const orderId = orderData.orderId;
      const cashfreeOrderId = orderData.cashfree?.orderId;

      console.log("Order creation response:", {
        orderData,
        paymentSessionId,
        orderId,
        cashfreeOrderId,
        cashfreeObject: !!cashfree,
      });

      if (!paymentSessionId) {
        console.error("Missing payment session:", orderData);
        toast.error("Failed to create payment session. Please try again.");
        setIsProcessing(false);
        return;
      }

      if (!cashfree) {
        console.error("Cashfree SDK not loaded");
        toast.error("Payment system not ready. Please refresh the page.");
        setIsProcessing(false);
        return;
      }

      // Store order info for verification
      localStorage.setItem("pendingOrderId", orderId);
      localStorage.setItem("pendingCashfreeOrderId", cashfreeOrderId);
      localStorage.setItem("pendingOrderAmount", totalAmount.toString());

      console.log(
        "Initializing Cashfree checkout with session:",
        paymentSessionId
      );

      // Initialize Cashfree checkout
      const result = await cashfree.checkout({
        paymentSessionId: paymentSessionId,
        redirectTarget: "_self",
      });

      console.log("Cashfree checkout result:", result);

      if (result?.error) {
        console.error("Cashfree checkout error:", result.error);
        toast.error("Payment initialization failed. Please try again.");
        setIsProcessing(false);
      } else if (!result?.redirect) {
        console.warn("Checkout may not have redirected properly", result);
        // Still allow the redirect to happen naturally
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error(error.response?.data?.message || "Payment failed to start");
      setIsProcessing(false);
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
           "x-api-key": "454ccaf106998a71760f6729e7f9edaf1df17055b297b3008ff8b65a5efd7c10"
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

              {/* One-Click Checkout Button */}
              
                {/* <div style={{ marginBottom: "20px" }}>
                  <button
                    onClick={handleOneClickCheckout}
                    disabled={isProcessing || !cashfree}
                    style={{
                      width: "100%",
                      padding: "15px",
                      backgroundColor: "#4F46E5",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "16px",
                      fontWeight: "600",
                      cursor:
                        isProcessing || !cashfree ? "not-allowed" : "pointer",
                      opacity: isProcessing || !cashfree ? 0.6 : 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                    }}
                  >
                    <Zap size={20} />
                    {isProcessing ? "Processing..." : "One-Click Checkout"}
                  </button>
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#666",
                      marginTop: "8px",
                      textAlign: "center",
                    }}
                  >
                    Cashfree will collect your address during checkout
                  </p>
                </div> */}
              

              {/* Divider */}
              {hasSavedAddress && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    margin: "20px 0",
                    gap: "10px",
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      height: "1px",
                      backgroundColor: "#ddd",
                    }}
                  ></div>
                  <span style={{ color: "#999", fontSize: "14px" }}>OR</span>
                  <div
                    style={{
                      flex: 1,
                      height: "1px",
                      backgroundColor: "#ddd",
                    }}
                  ></div>
                </div>
              )}

              <PriceList
                bagTotal={bagTotal}
                grandTotal={grandTotal}
                handlePayNow={handleOneClickCheckout}
                offerData={offerData}
                isProcessing={isProcessing}
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