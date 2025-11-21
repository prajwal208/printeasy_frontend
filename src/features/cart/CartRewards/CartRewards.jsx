"use client";
import React from "react";
import styles from "./cartRewards.module.scss";
import { Truck, Gift, Shield } from "lucide-react";

const CartRewards = ({ totalAmount }) => {
  const milestones = [
    { amount: 0, label: "", icon: null },
    { amount: 500, label: "Free Shipping", icon: <Truck size={18} /> },
    { amount: 600, label: "Exclusive Offer", icon: <Shield size={18} /> },
    { amount: 900, label: "Gift Unlocked", icon: <Gift size={18} /> },
  ];

  // 🧮 Find which milestone range we are in
  let currentIndex = milestones.findIndex((m) => totalAmount < m.amount);
  if (currentIndex === -1) currentIndex = milestones.length - 1; // all unlocked

  const prevMilestone = milestones[currentIndex - 1] || milestones[0];
  const nextMilestone = milestones[currentIndex] || milestones[milestones.length - 1];

  // 🧠 Calculate progress between milestones
  const segmentProgress =
    ((totalAmount - prevMilestone.amount) /
      (nextMilestone.amount - prevMilestone.amount)) *
    (100 / (milestones.length - 1));

  const totalProgress =
    (currentIndex - 1) * (100 / (milestones.length - 1)) +
    Math.min(segmentProgress, 100 / (milestones.length - 1));

  // Determine if milestone is active
  const isActive = (amount) => totalAmount >= amount;

  return (
    <div className={styles.rewardsContainer}>
      <h3 className={styles.title}>🎁 Unlock Rewards with Your Orders</h3>

      <div className={styles.progressBar}>
        <div className={styles.progressLine}>
          <div
            className={styles.progressFill}
            style={{ width: `${totalProgress}%` }}
          />
        </div>

        <div className={styles.milestones}>
          {milestones.map((m, index) => (
            <div
              key={index}
              className={`${styles.milestone} ${
                isActive(m.amount) ? styles.active : ""
              }`}
            >
              <div
                className={`${styles.iconCircle} ${
                  m.amount === 0 ? styles.empty : ""
                }`}
              >
                {m.icon}
              </div>
              {m.amount > 0 && (
                <span className={styles.amount}>₹{m.amount}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {nextMilestone && nextMilestone.amount > totalAmount ? (
        <p className={styles.rewardText}>
          Spend ₹{nextMilestone.amount - totalAmount} more to unlock{" "}
          <b>{nextMilestone.label}</b>!
        </p>
      ) : (
        <p className={styles.rewardTextSuccess}>🎉 All rewards unlocked!</p>
      )}
    </div>
  );
};

export default CartRewards;
