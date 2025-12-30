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

  const [cartItems, setCartItems] = useState([]);
  const [addressList, setAddressList] = useState([]);
  const [offerData, setOfferData] = useState([]);
  const [cashfree, setCashfree] = useState(null);
  const [cartLoader, setCartLodaer] = useState(false);
  const [showCartUI, setShowCartUI] = useState(true);

  /* ---------------- INIT CASHFREE ---------------- */
  useEffect(() => {
    const initCashfree = async () => {
      const cf = await load({ mode: "production" });
      setCashfree(cf);
    };
    initCashfree();
  }, []);

  /* ---------------- LOAD DATA ---------------- */
  useEffect(() => {
    db.cart.toArray().then(setCartItems);
    getAddressList();
    getOfferData();
  }, []);

  /* ---------------- HELPERS ---------------- */
  const calculateTotal = () =>
    cartItems.reduce(
      (sum, item) => sum + Number(item.discountPrice || 0) * item.quantity,
      0
    );

  const bagTotal = calculateTotal();
  const grandTotal = bagTotal;

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

  /* ---------------- PAY NOW ---------------- */
  const handlePayNow = async () => {
    if (!cashfree) {
      toast.error("Payment SDK not loaded");
      return;
    }

    try {
      setCartLodaer(true);

      const orderPayloadItems = cartItems.map((item) => ({
        name: item.name,
        totalPrice: item.totalPrice,
        quantity: item.quantity,
        productImageUrl: item.fullProductUrl,
        isCustomizable: item.isCustomizable,
      }));

      const orderRes = await api.post(
        "/v1/orders/create",
        {
          paymentMethod: "ONLINE",
          totalAmount: grandTotal,
          items: orderPayloadItems,
        },
        {
          headers: { "x-api-key": process.env.NEXT_PUBLIC_API_KEY },
        }
      );

      const orderData = orderRes?.data?.data;
      const paymentSessionId = orderData?.cashfree?.sessionId;

      if (!paymentSessionId) {
        toast.error("Payment session not generated");
        return;
      }

      setShowCartUI(false);

      /* 🔥 EMBEDDED CHECKOUT WITH RESULT HANDLING */
      cashfree
        .checkout({
          paymentSessionId,
          redirectTarget: document.getElementById("cashfree-dropin"),
        })
        .then((result) => {
          if (result.error) {
            toast.error(result.error.message);
            setShowCartUI(true);
            return;
          }

          if (result.paymentDetails?.paymentStatus === "SUCCESS") {
            router.push(
              `/order-success?order_id=${orderData.orderId}`
            );
          }
        });
    } catch (err) {
      console.error(err);
      toast.error("Payment failed");
      setShowCartUI(true);
    } finally {
      setCartLodaer(false);
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <>
      <div id="cashfree-dropin" />

      {showCartUI && (
        <div className={styles.cartPage}>
          <ToastContainer />

          {cartItems.length ? (
            <>
              <button onClick={() => router.push("/")}>
                <ChevronLeft />
              </button>

              <CartRewards totalAmount={bagTotal} />

              <div className={styles.cartContainer}>
                <div className={styles.cartItems}>
                  {cartItems.map((item) => (
                    <div key={item.id} className={styles.cartItem}>
                      <img src={item.productImageUrl} />
                      <h3>{item.name}</h3>
                      <Trash2
                        onClick={() => db.cart.delete(item.id)}
                      />
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

              <DynamicModal open={cartLoader}>
                <AddToBagLoader />
              </DynamicModal>
            </>
          ) : (
            <NoResult
              title="Cart Empty"
              buttonText="Explore"
              onButtonClick={() => router.push("/")}
            />
          )}
        </div>
      )}
    </>
  );
};

export default Cart;
