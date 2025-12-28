"use client";

import NoResult from "@/component/NoResult/NoResult";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import styles from "./orders.module.scss";
import api from "@/axiosInstance/axiosInstance";

const Page = () => {
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const orderId =
    typeof window !== "undefined"
      ? localStorage.getItem("orderId")
      : null;

  const getUserOrder = async () => {
    try {
      const res = await api.get(`/v1/orders/${orderId}`, {
        headers: {
          "x-api-key":
            "454ccaf106998a71760f6729e7f9edaf1df17055b297b3008ff8b65a5efd7c10",
        },
      });

      setOrder(res?.data?.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
   getUserOrder();
  }, []);

  if (loading) return null;

  if (!order) {
    return (
      <div className={styles.orders_main_wrap}>
        <NoResult
          title="No Orders Yet"
          description="You havent placed any orders.When you do your orders will appear here. Start shopping now and track your purchase all in one place."
          buttonText="Explore"
          onButtonClick={() => router.push("/")}
        />
      </div>
    );
  }

  const item = order.items[0];

  return (
    <div className={styles.orders_main_wrap}>
      <h2>Your Orders</h2>
      <div className={styles.order_card}>
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

        {/* PRODUCT */}
        <div className={styles.product_section}>
          <img
            src={item.productImageUrl}
            alt={item.name}
            className={styles.product_image}
          />

          <div className={styles.product_info}>
            <h3>{item.name}</h3>
            <p>Qty: {item.quantity}</p>
            <p className={styles.price}>₹{order.totalAmount}</p>
          </div>
        </div>

        {/* ADDRESS */}
        <div className={styles.address_section}>
          <h4>Delivery Address</h4>
          <p>
            <strong>{order.shipAddress.name}</strong>
          </p>
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
    </div>
  );
};

export default Page;
