"use client";
import React, { useEffect, useState } from "react";
import { Trash2, ChevronLeft, Heart } from "lucide-react";
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
import {
  PAYMENT_METHOD,
  createOrder,
  getCashfreeSessionError,
  getFirebaseUidFromToken,
  launchCashfreeCheckout,
  mapAddressForOrder,
  persistPendingOrder,
} from "@/lib/payment";
import DynamicModal from "@/component/Modal/Modal";
import LoginForm from "../signup/LogIn/LoginForm";
import AddToBagLoader from "@/component/AddToBagLoader/AddToBagLoader";
import CartSuggestion from "@/component/CartSuggetion/CartSuggestion";
import CartMobile from "./CartMobile/CartMobile";

const Cart = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const [cartItems, setCartItems] = useState([]);
  const [addressList, setAddressList] = useState([]);
  const [offerData, setOfferData] = useState([]);
  const router = useRouter();
  const accessToken = Cookies.get("idToken");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoginModalVisible, setIsLoginModalVisible] = useState(false);
  const [cartLoader, setCartLoader] = useState(false);
  const [showCartUI, setShowCartUI] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHOD.ONLINE);
  const [isSubmitting, setIsSubmitting] = useState(false);

  console.log(cartItems,"shssjsuuyyy")

  const handleContinue = () => {
    setIsLoginModalVisible(false);
    setIsLoggedIn(true);
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

  useEffect(() => {
    queueMicrotask(() => {
      void db.cart.toArray().then(setCartItems);
      void getAddressList();
      void getOfferData();
    });
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

  const removeFromCart = async (productId) => {
    try {
      const item = await db.cart.where("productId").equals(productId).first();
      if (!item) return;
      await db.cart.delete(item.id);
      setCartItems((prev) => prev.filter((i) => i.productId !== productId));
    } catch (err) {
      toast.error("Failed to remove item");
    }
  };

  console.log(cartItems, "sososppppoooooo");

  const orderPayloadItems = cartItems.map((item) => ({
    name: item.name,
    sku: item.sku || item.productId,
    totalPrice: item.totalPrice,
    quantity: item.quantity,
    categoryId: item.categoryId,
    isCustomizable: !!item.isCustomizable,
    productImageUrl: item?.renderedImageUrl,
    sizeInfo: item?.options,
    discount: item.discount || 0,
    tax: item.tax || 0,
    hsn: item.hsn || null,
    printingImgText: {
      printText: item?.presetText,
      textColor: item.textColor || "",
      fontFamily: item.fontFamily || "",
      fontSize: item.fontSize || "",
      illustrationImage: item?.illustrationImage,
      shirtImage: item?.canvasImage,
    },
  }));

  const customizableItem = cartItems.find((item) => item.isCustomizable);
  const uploadImagePayload = customizableItem
    ? {
        printText: customizableItem.presetText || "Empty Text",
        textColor: customizableItem.textColor || "",
        fontFamily: customizableItem.fontFamily || "",
        fontSize: customizableItem.fontSize || "",
        illustrationImage: customizableItem?.illustrationImage,
      }
    : null;

  const hasCustomizable = cartItems.some((item) => item.isCustomizable);
  const defaultAddress = addressList.find((addr) => addr.isDefault === true);

  const handlePlaceOrder = async (selectedMethod, finalPayable) => {
    if (cartItems.length === 0) {
      toast.warning("Your cart is empty!");
      return;
    }

    if (selectedMethod === PAYMENT_METHOD.COD && !defaultAddress) {
      toast.warning("Please add a delivery address for cash on delivery.");
      router.push("/address");
      return;
    }

    try {
      setIsSubmitting(true);
      setCartLoader(true);
      window.scrollTo(0, 0);

      const finalItems = orderPayloadItems.map((item) => ({ ...item }));
      const uid = getFirebaseUidFromToken(accessToken);
      const user =
        selectedMethod === PAYMENT_METHOD.COD
          ? {
              id: uid,
              address: mapAddressForOrder({
                name: defaultAddress?.name,
                line1: defaultAddress?.line1,
                line2: defaultAddress?.line2,
                city: defaultAddress?.city,
                state: defaultAddress?.state,
                country: defaultAddress?.country,
                pincode: defaultAddress?.pincode,
                phone: defaultAddress?.phone,
              }),
            }
          : { id: uid };

      const orderData = await createOrder({
        paymentMethod: selectedMethod,
        totalAmount: finalPayable,
        items: finalItems,
        user,
      });

      const cashfreeError = getCashfreeSessionError(orderData);
      if (cashfreeError) {
        toast.error(cashfreeError);
        return;
      }

      if (selectedMethod === PAYMENT_METHOD.COD) {
        localStorage.setItem("orderId", orderData.orderId);
        await db.cart.clear();
        toast.success("Order placed successfully!");
        router.push("/orders");
        return;
      }

      persistPendingOrder(orderData, selectedMethod);
      await launchCashfreeCheckout(orderData.cashfree.sessionId);
    } catch (error) {
      console.error("Payment error:", error);
      toast.error(
        error?.response?.data?.message || "Failed to initiate payment"
      );
    } finally {
      setIsSubmitting(false);
      setCartLoader(false);
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
            "x-api-key":
              "454ccaf106998a71760f6729e7f9edaf1df17055b297b3008ff8b65a5efd7c10",
          },
        },
      );
      toast.success("Added to wishlist!");
    } catch (error) {
      toast.error("Failed to add to wishlist");
    }
  };

  return (
    <>
     

      {/* <div
        id="cashfree-dropin"
        style={{
         width: "100%",
          height: showCartUI ? "0" : "auto",
          display: showCartUI ? "none" : "flex",
          justifyContent: "center",
          overflow:"hidden",
        }}
      /> */}

      
        <div className={styles.cartPage}>
          <ToastContainer position="top-right" autoClose={2000} />
          {cartItems?.length > 0 ? (
            <>
              <div className={styles.mobileOnly}>
                <CartMobile
                  cartItems={cartItems}
                  bagTotal={bagTotal}
                  offerData={offerData}
                  paymentMethod={paymentMethod}
                  onPaymentMethodChange={setPaymentMethod}
                  hasCustomizable={hasCustomizable}
                  isSubmitting={isSubmitting}
                  onPlaceOrder={handlePlaceOrder}
                  onQuantityChange={handleQuantityChange}
                  onRemove={removeFromCart}
                  onWishlist={addToWishlist}
                  onBack={() => router.push("/")}
                  cartCount={cartItems.length}
                />
              </div>

              <div className={styles.desktopOnly}>
              <div className={styles.topNav}>
                <button
                  type="button"
                  className={styles.navBack}
                  onClick={() => router.push("/")}
                  aria-label="Back"
                >
                  <ChevronLeft size={20} />
                </button>
                <h1 className={styles.navTitle}>
                  <span>ON</span>RISE — MY CART
                </h1>
                <span className={styles.navBadge}>
                  {cartItems.length}{" "}
                  {cartItems.length === 1 ? "Item" : "Items"}
                </span>
              </div>

              <CartRewards totalAmount={bagTotal} />

              <div className={styles.cartContainer}>
                <div className={styles.cartItems}>
                  <div className={styles.secLabel}>
                    Your Items
                    <span className={styles.secCount}>
                      {cartItems.length}{" "}
                      {cartItems.length === 1 ? "shirt" : "shirts"}
                    </span>
                  </div>

                  {cartItems.map((item) => {
                    const sizeLabel = item?.options?.[0]?.value;
                    const presetText = item?.presetText;
                    const basePrice = Number(item?.basePrice) || 0;
                    const discPrice =
                      Number(item?.discountPrice) || basePrice;
                    const save =
                      Math.max(0, basePrice - discPrice) *
                      (item.quantity || 1);

                    return (
                      <div key={item.id} className={styles.ci}>
                        <div className={styles.ciTop}>
                          <div className={styles.ciImg}>
                            {item.productImageUrl ? (
                              <img
                                src={item.productImageUrl}
                                alt={item.name}
                              />
                            ) : (
                              <div className={styles.ciEmoji}>🎽</div>
                            )}
                            {item.isCustomizable && (
                              <div className={styles.ciBadge}>
                                PERSONALISED
                              </div>
                            )}
                          </div>
                          <div className={styles.ciInfo}>
                            <h3 className={styles.ciName}>{item.name}</h3>
                            {presetText &&
                              presetText !== "Empty Text" && (
                                <div className={styles.ciWord}>
                                  <span className={styles.ciWordStar}>
                                    ✦
                                  </span>
                                  <span className={styles.ciWordLbl}>
                                    {String(presetText).toUpperCase()}
                                  </span>
                                </div>
                              )}
                            <div className={styles.ciTags}>
                              {sizeLabel && (
                                <span className={styles.ciTag}>
                                  Size: {sizeLabel}
                                </span>
                              )}
                              {item.isCustomizable && (
                                <span className={styles.ciTag}>
                                  Custom Print
                                </span>
                              )}
                            </div>
                          </div>
                          <div className={styles.ciR}>
                            {basePrice > discPrice && (
                              <div className={styles.ciOld}>
                                ₹{basePrice}
                              </div>
                            )}
                            <div className={styles.ciPrice}>
                              ₹{discPrice}
                            </div>
                            {save > 0 && (
                              <div className={styles.ciSave}>
                                Save ₹{save}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className={styles.ciBot}>
                          <div className={styles.ciActs}>
                            <button
                              type="button"
                              className={styles.ciWish}
                              onClick={() =>
                                addToWishlist(item?.productId)
                              }
                            >
                              <Heart
                                size={16}
                                fill="#ff4500"
                                strokeWidth={0}
                              />
                              <span>Wishlist</span>
                            </button>
                            <button
                              type="button"
                              className={styles.ciDel}
                              onClick={() =>
                                removeFromCart(item?.productId)
                              }
                              aria-label="Remove item"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          <div className={styles.ciQty}>
                            <button
                              type="button"
                              className={styles.qBtn}
                              onClick={() =>
                                handleQuantityChange(
                                  item.id,
                                  Math.max(1, (item.quantity || 1) - 1)
                                )
                              }
                              aria-label="Decrease quantity"
                            >
                              −
                            </button>
                            <div className={styles.qN}>
                              {item.quantity || 1}
                            </div>
                            <button
                              type="button"
                              className={styles.qBtn}
                              onClick={() =>
                                handleQuantityChange(
                                  item.id,
                                  (item.quantity || 1) + 1
                                )
                              }
                              aria-label="Increase quantity"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className={styles.rightSection}>
                  <DefaultAddress
                    addressList={addressList}
                    onChange={() => router.push("/address")}
                  />
                  <PriceList
                    bagTotal={bagTotal}
                    grandTotal={grandTotal}
                    paymentMethod={paymentMethod}
                    onPaymentMethodChange={setPaymentMethod}
                    onPlaceOrder={handlePlaceOrder}
                    offerData={offerData}
                    hasCustomizable={hasCustomizable}
                    isSubmitting={isSubmitting}
                  />
                </div>
              </div>

              <div className={styles.cartsuggestion}>
                <CartSuggestion />
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

              <DynamicModal
                open={cartLoader}
                onClose={() => setCartLoader(false)}
              >
                <AddToBagLoader />
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
      
    </>
  );
};

export default Cart;