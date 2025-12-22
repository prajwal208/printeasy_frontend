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
import api from "@/axiosInstance/axiosInstance";
import { db } from "@/lib/db";
import Cookies from "js-cookie";
import { load } from "@cashfreepayments/cashfree-js";
import DynamicModal from "@/component/Modal/Modal";
import LoginForm from "../signup/LogIn/LoginForm";

const Cart = () => {
  const router = useRouter();
  const [cartItems, setCartItems] = useState([]);
  const [addressList, setAddressList] = useState([]);
  const [offerData, setOfferData] = useState([]);
  const [cashfree, setCashfree] = useState(null);
  const [isLoginModalVisible, setIsLoginModalVisible] = useState(false);

  useEffect(() => {
    load({ mode: "production" }).then(setCashfree);
  }, []);

  useEffect(() => {
    db.cart.toArray().then(setCartItems);
    getAddressList();
    getOfferData();
  }, []);

  const calculateTotal = () =>
    cartItems.reduce(
      (sum, i) => sum + Number(i.discountPrice) * Number(i.quantity),
      0
    );

  const bagTotal = calculateTotal();
  const grandTotal = bagTotal;

  const getAddressList = async () => {
    const res = await api.get("/v1/address/all");
    setAddressList(res?.data?.data || []);
  };

  const getOfferData = async () => {
    const res = await api.get("/v2/giftreward");
    setOfferData(res?.data?.data || []);
  };

  // 🔐 ONE CLICK PAY
  const handlePayNow = async () => {
    if (!Cookies.get("idToken")) {
      setIsLoginModalVisible(true);
      return;
    }

    if (!cartItems.length) {
      toast.warning("Cart is empty");
      return;
    }

    if (!addressList?.[0]?.id) {
      toast.warning("Select shipping address");
      return;
    }

    try {
      const items = cartItems.map((item) => ({
        productId: item.productId,
        name: item.name,
        sku: item.sku,
        totalPrice: Number(item.discountPrice),
        quantity: Number(item.quantity),
        categoryId: item.categoryId,
        isCustomizable: item.isCustomizable || false,
        discount: 0,
        tax: 0,
      }));

      const res = await api.post("/v1/orders/create", {
        shippingAddressId: addressList[0].id,
        billingAddressId: addressList[0].id,
        paymentMethod: "ONLINE",
        items,
      });

      const { orderId, cashfreeOrderId, paymentSessionId } =
        res.data.data;

      // Store for polling page
      localStorage.setItem("pendingOrderId", orderId);
      localStorage.setItem("pendingCashfreeOrderId", cashfreeOrderId);

      if (!paymentSessionId) {
        toast.error("Payment session missing");
        return;
      }

      await cashfree.checkout({
        paymentSessionId,
        redirectTarget: "_self",
      });

      // Redirect manually (recommended)
      router.push("/order-success");
    } catch (err) {
      console.error(err);
      toast.error("Payment initiation failed");
    }
  };

  return (
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
                  <img src={item.productImageUrl} alt={item.name} />
                  <h3>{item.name}</h3>
                  <button
                    onClick={() =>
                      db.cart.delete(item.id).then(() =>
                        setCartItems((p) =>
                          p.filter((x) => x.id !== item.id)
                        )
                      )
                    }
                  >
                    <Trash2 />
                  </button>
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
            <LoginForm onContinue={() => setIsLoginModalVisible(false)} />
          </DynamicModal>
        </>
      ) : (
        <NoResult
          title="Your cart is empty"
          buttonText="Explore"
          onButtonClick={() => router.push("/")}
        />
      )}
    </div>
  );
};

export default Cart;
