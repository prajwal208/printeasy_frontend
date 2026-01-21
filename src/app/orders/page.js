"use client";

import NoResult from "@/component/NoResult/NoResult";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import styles from "./orders.module.scss";
import api from "@/axiosInstance/axiosInstance";
import Cookies from "js-cookie";
import Header from "@/component/header/Header";

const Page = () => {
  const router = useRouter();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const orderId =
    typeof window !== "undefined"
      ? localStorage.getItem("orderId")
      : null;

  /* ------------------ AUTH CHECK ------------------ */
  useEffect(() => {
    const token = Cookies.get("idToken");
    setIsLoggedIn(!!token);
  }, []);

  /* ------------------ GUEST ORDER ------------------ */
  const getUserOrder = async () => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    try {
      const res = await api.get(`/v1/orders/${orderId}`, {
        headers: {
          "x-api-key":
            "454ccaf106998a71760f6729e7f9edaf1df17055b297b3008ff8b65a5efd7c10",
        },
      });
      console.log(res,"sisosioioioi")
      const data = Array.isArray(res?.data?.data)
        ? res.data.data
        : [res.data.data];

      setOrders(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  /* ------------------ LOGGED IN ORDERS ------------------ */
  const getLoggedInOrders = async () => {
    try {
      const res = await api.get(`/v1/orders/all-by-phone`, {
        headers: {
          "x-api-key":
            "454ccaf106998a71760f6729e7f9edaf1df17055b297b3008ff8b65a5efd7c10",
        },
      });

      setOrders(res?.data?.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  /* ------------------ CONDITIONAL API CALL ------------------ */
  useEffect(() => {
    if (isLoggedIn) {
      getLoggedInOrders();
    } else {
      getUserOrder();
    }
  }, [isLoggedIn]);

  /* ------------------ LOADING ------------------ */
  if (loading) {
    return (
      <div className={styles.orders_main_wrap}>
        <h2>Your Orders</h2>
        <div className={styles.order_card}>
          <div className={styles.shimmerWrapper}>
            <div className={styles.shimmer}></div>
          </div>
        </div>
      </div>
    );
  }

  /* ------------------ NO ORDERS ------------------ */
  if (!orders.length) {
    return (
      <div className={styles.orders_main_wrap}>
        <NoResult
          title="No Orders Yet"
          description="You haven’t placed any orders. When you do, your orders will appear here."
          buttonText="Explore"
          onButtonClick={() => router.push("/")}
        />
      </div>
    );
  }

  /* ------------------ ORDERS LIST ------------------ */
  return (
    <>
    <div className={styles.mobileHeader}>
        <Header />
      </div>
    <div className={styles.orders_main_wrap}>
      
      <h2>Your Orders</h2>

    {orders.map((order) => (
  <div className={styles.order_card} key={order.orderId}>
    {/* HEADER */}
    <div className={styles.order_header}>
      <div>
        <p className={styles.order_id}>Order #{order.orderId}</p>
        <p className={styles.order_date}>
          Placed on {new Date(order.orderDate).toDateString()}
        </p>
      </div>

      <span className={`${styles.status} ${styles.confirmed}`}>
        {order.status}
      </span>
    </div>

    {/* ✅ MULTIPLE PRODUCTS */}
    {order.items?.map((item, index) => (
      <div className={styles.product_section} key={index}>
        <img
          src={item.renderedImageUrl || item.productImageUrl}
          alt={item.name}
          className={styles.product_image}
        />

        <div className={styles.product_info}>
          <h3>{item.name}</h3>
          <p>Qty: {item.quantity}</p>
          <p className={styles.price}>₹{item.totalPrice}</p>
        </div>
      </div>
    ))}

    {/* ADDRESS */}
    <div className={styles.address_section}>
      <h4>Delivery Address</h4>
      <p><strong>{order.shipAddress.name}</strong></p>
      <p>{order.shipAddress.addressLine1}</p>
      <p>
        {order.shipAddress.city}, {order.shipAddress.state}{" "}
        {order.shipAddress.pinCode}
      </p>
      <p>Phone: {order.shipAddress.phone}</p>
    </div>

    {/* SHIPMENT */}
    {order.shiprocket && (
      <div className={styles.shipment_section}>
        <div>
          <span>Shipment ID</span>
          <p>{order.shiprocket.shipmentId}</p>
        </div>
        <div>
          <span>Order Number</span>
          <p>{order.shiprocket.orderNumber}</p>
        </div>
      </div>
    )}
  </div>
))}

    </div>
    </>
  );
};

export default Page;
