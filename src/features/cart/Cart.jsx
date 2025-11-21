"use client";
import React, { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import styles from "./cart.module.scss";
import NoResult from "@/component/NoResult/NoResult";
import { useRouter } from "next/navigation";
import CartRewards from "./CartRewards/CartRewards";
import DefaultAddress from "./DefaultAddress/DefaultAddress";
import PriceList from "./PriceList/PriceList";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from "@/axiosInstance/axiosInstance";

const Cart = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const [cartItems, setCartItems] = useState([]);
  const [addressList, setAddressList] = useState([]);
  const router = useRouter();

  console.log(cartItems[0]?.id,"sjsjueyeynnbbcvcv")

  const handleQuantityChange = (id, newQuantity) => {
    if (newQuantity < 1) return;
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => {
      const price =
        Number(item.price) ||
        Number(item.totalPrice) ||
        Number(item.product?.price) ||
        0;
      const qty = Number(item.quantity) || 1;
      return sum + price * qty;
    }, 0);
  };

  const bagTotal = calculateTotal();
  const couponDiscount = 0;
  const grandTotal = bagTotal - couponDiscount;

  const getCartData = async () => {
    try {
      const res = await api.get(`/v1/cart`, {
        headers: {
          "x-api-key":
            "454ccaf106998a71760f6729e7f9edaf1df17055b297b3008ff8b65a5efd7c10",
        },
      });
      setCartItems(res?.data?.data || []);
    } catch (error) {
      console.error("❌ Error fetching cart:", error);
      toast.error("Failed to fetch cart.");
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/v1/cart?itemId=${id}`, {
        headers: {
          "x-api-key":
            "454ccaf106998a71760f6729e7f9edaf1df17055b297b3008ff8b65a5efd7c10",
        },
      });
      setCartItems((prev) => prev.filter((item) => item.id !== id));
      toast.success("Item removed from cart.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to remove item.");
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

  console.log(addressList?.[0]?.id,"sjsjueyeterrxxx")

  useEffect(() => {
    getCartData();
    getAddressList();
  }, []);

  // ----------------- Razorpay Integration -----------------
  const handlePayNow = async () => {
    if (cartItems.length === 0) {
      toast.warning("Your cart is empty!");
      return;
    }

    try {
      const res = await api.post(`/v1/orders/create`,
        {
          shippingAddressId: addressList?.[0].id,
          billingAddressId: addressList?.[0].id,
          cartIds: cartItems.map(item => item.id),
          // couponCode: "",
          items:[],
          paymentMethod: "ONLINE",
          totalAmount:grandTotal,
        },
        {
          headers: {
            "x-api-key":
              "454ccaf106998a71760f6729e7f9edaf1df17055b297b3008ff8b65a5efd7c10",
          },
        }
      );

      const { orderId, currency } = res.data.data;

      // Step 2: Open Razorpay Checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY,
        amount: grandTotal * 100,
        currency: currency || "INR",
        name: "Your Store Name",
        description: "Order Payment",
        order_id: orderId,
        handler: async function (response) {
          // Step 3: Capture payment on backend
          try {
            await api.post(`/v1/payment/verify`,
              { ...response, cartItems },
              {
                headers: {
                  "x-api-key":
                    "454ccaf106998a71760f6729e7f9edaf1df17055b297b3008ff8b65a5efd7c10",
                },
              }
            );
            toast.success("Payment successful!");
            router.push("/order/success");
          } catch (err) {
            console.error(err);
            toast.error("Payment verification failed!");
          }
        },
        prefill: {
          name: "John Doe",
          email: "john@example.com",
          contact: "9999999999",
        },
        theme: {
          color: "#ff6b00",
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error(error);
      toast.error("Failed to initiate payment.");
    }
  };

  return (
    <div className={styles.cartPage}>
      <ToastContainer position="top-right" autoClose={2000} />
      {cartItems?.length > 0 ? (
        <>
          <CartRewards totalAmount={bagTotal} />

          <div className={styles.cartContainer}>
            <div className={styles.cartItems}>
              {cartItems.map((item) => (
                <div key={item.id} className={styles.cartItem}>
                  <div className={styles.itemImage}>
                    <img src={item.productImageUrl} alt={item.name} />
                  </div>

                  <div className={styles.itemDetails}>
                    <div>
                      <div className={styles.itemHeader}>
                        <h3 className={styles.itemName}>{item.name}</h3>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className={styles.removeBtn}
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>

                      <div className={styles.itemMeta}>
                        <span>
                          {item.options?.size} | {item.options?.color}
                        </span>
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
                    </div>

                    <div className={styles.itemFooter}>
                      <button className={styles.wishlistBtn}>
                        MOVE TO WISHLIST
                      </button>
                      <span className={styles.itemPrice}>
                        ₹
                        {item.price ||
                          item.totalPrice ||
                          item.product?.price ||
                          0}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.rightSection}>
              <DefaultAddress
                addressList={addressList}
                onChange={() => console.log("Change Address Clicked")}
              />
              <PriceList
                bagTotal={bagTotal}
                grandTotal={grandTotal}
                handlePayNow={handlePayNow}
              />
            </div>
          </div>
        </>
      ) : (
        <NoResult
          title="Oops! Your Cart is Empty"
          description="It seems like your shopping cart is currently empty. Start adding items to your cart to continue shopping and enjoy a seamless checkout experience. Explore our products and find the perfect items for you."
          buttonText="Explore"
          onButtonClick={() => router.push("/")}
        />
      )}
    </div>
  );
};

export default Cart;
