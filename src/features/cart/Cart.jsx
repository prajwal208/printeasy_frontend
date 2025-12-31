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
import AddToBagLoader from "@/component/AddToBagLoader/AddToBagLoader";

const Cart = () => {
  const router = useRouter();
  const accessToken = Cookies.get("idToken");

  const [cartItems, setCartItems] = useState([]);
  const [addressList, setAddressList] = useState([]);
  const [offerData, setOfferData] = useState([]);
  const [cashfree, setCashfree] = useState<any>(null);
  const [cartLoader, setCartLoader] = useState(false);
  const [isLoginModalVisible, setIsLoginModalVisible] = useState(false);

  /* ---------------- INIT CASHFREE ---------------- */
  useEffect(() => {
    const init = async () => {
      const cf = await load({ mode: "production" });
      setCashfree(cf);
    };
    init();
  }, []);

  /* ---------------- CASHFREE EVENTS ---------------- */
  useEffect(() => {
    if (!cashfree) return;

    cashfree.on("PAYMENT_SUCCESS", () => {
      router.push("/order-success");
    });

    cashfree.on("PAYMENT_FAILED", () => {
      toast.error("Payment failed");
    });

    cashfree.on("PAYMENT_CANCELLED", () => {
      toast.warning("Payment cancelled");
    });
  }, [cashfree, router]);

  /* ---------------- LOAD CART ---------------- */
  useEffect(() => {
    db.cart.toArray().then(setCartItems);
    getAddressList();
    getOfferData();
  }, []);

  /* ---------------- HELPERS ---------------- */
  const calculateTotal = () =>
    cartItems.reduce(
      (sum, i) => sum + Number(i.discountPrice) * Number(i.quantity),
      0
    );

  const bagTotal = calculateTotal();
  const grandTotal = bagTotal;

  const handleQuantityChange = async (id, qty) => {
    if (qty < 1) return;
    await db.cart.update(id, { quantity: qty });
    setCartItems(await db.cart.toArray());
  };

  const removeFromCart = async (productId) => {
    const item = await db.cart.where("productId").equals(productId).first();
    if (item) {
      await db.cart.delete(item.id);
      setCartItems(await db.cart.toArray());
    }
  };

  /* ---------------- API CALLS ---------------- */
  const getAddressList = async () => {
    const res = await api.get("/v1/address/all", {
      headers: { "x-api-key": process.env.NEXT_PUBLIC_API_KEY },
    });
    setAddressList(res?.data?.data || []);
  };

  const getOfferData = async () => {
    const res = await api.get("/v2/giftreward", {
      headers: { "x-api-key": process.env.NEXT_PUBLIC_API_KEY },
    });
    setOfferData(res?.data?.data || []);
  };

  /* ---------------- PAYMENT ---------------- */
  const handlePayNow = async () => {
    if (!cartItems.length) {
      toast.warning("Cart is empty");
      return;
    }

    try {
      setCartLoader(true);

      const items = cartItems.map((i) => ({
        name: i.name,
        sku: i.productId,
        quantity: i.quantity,
        totalPrice: i.discountPrice * i.quantity,
        productImageUrl: i.fullProductUrl,
      }));

      const orderRes = await api.post(
        "/v1/orders/create",
        {
          paymentMethod: "ONLINE",
          totalAmount: grandTotal,
          items,
        },
        {
          headers: { "x-api-key": process.env.NEXT_PUBLIC_API_KEY },
        }
      );

      const order = orderRes.data.data;

      /* STORE FOR ORDER-SUCCESS POLLING */
      localStorage.setItem("pendingOrderId", order.orderId);
      localStorage.setItem(
        "pendingCashfreeOrderId",
        order.cashfree.orderId
      );
      localStorage.setItem("pendingOrderAmount", grandTotal.toString());

      /* EMBEDDED CHECKOUT */
      cashfree.checkout({
        paymentSessionId: order.cashfree.sessionId,
        redirectTarget: "#cashfree-dropin",
      });
    } catch (err) {
      toast.error("Unable to initiate payment");
    } finally {
      setCartLoader(false);
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <>
      <ToastContainer position="top-right" />
      <div id="cashfree-dropin" />

      {cartItems.length ? (
        <div className={styles.cartPage}>
          <button onClick={() => router.push("/")}>
            <ChevronLeft />
          </button>

          <CartRewards totalAmount={bagTotal} />

          <div className={styles.cartContainer}>
            <div>
              {cartItems.map((item) => (
                <div key={item.id} className={styles.cartItem}>
                  <img src={item.productImageUrl} alt={item.name} />

                  <h3>{item.name}</h3>

                  <select
                    value={item.quantity}
                    onChange={(e) =>
                      handleQuantityChange(item.id, +e.target.value)
                    }
                  >
                    {[...Array(10)].map((_, i) => (
                      <option key={i + 1}>{i + 1}</option>
                    ))}
                  </select>

                  <button onClick={() => removeFromCart(item.productId)}>
                    <Trash2 />
                  </button>
                </div>
              ))}
            </div>

            <div>
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
        </div>
      ) : (
        <NoResult
          title="Your Cart is Empty"
          buttonText="Shop Now"
          onButtonClick={() => router.push("/")}
        />
      )}

      <DynamicModal open={cartLoader}>
        <AddToBagLoader />
      </DynamicModal>

      <DynamicModal
        open={isLoginModalVisible}
        onClose={() => setIsLoginModalVisible(false)}
      >
        <LoginForm onContinue={() => setIsLoginModalVisible(false)} />
      </DynamicModal>
    </>
  );
};

export default Cart;
