"use client";
import React from "react";
import styles from "./cartRewards.module.scss";
import { TbTruckDelivery, TbRosetteDiscount, TbGift } from "react-icons/tb";

const iconSize = 20;
const iconStrokeWidth = 1.75;

const CartRewards = ({ totalAmount }) => {
  const iconProps = {
    size: iconSize,
    strokeWidth: iconStrokeWidth,
    className: styles.tierIcon,
  };

  const milestones = [
    { amount: 0, label: "", icon: null },
    {
      amount: 500,
      label: "Free Shipping",
      icon: <TbTruckDelivery {...iconProps} />,
    },
    {
      amount: 600,
      label: "Exclusive Offer",
      icon: <TbRosetteDiscount {...iconProps} />,
    },
    {
      amount: 900,
      label: "Gift Unlocked",
      icon: <TbGift {...iconProps} />,
    },
  ];

  // 🧮 Find which milestone range we are in
  let currentIndex = milestones.findIndex((m) => totalAmount < m.amount);
  if (currentIndex === -1) currentIndex = milestones.length - 1; // all unlocked

  const prevMilestone = milestones[currentIndex - 1] || milestones[0];
  const nextMilestone = milestones[currentIndex] || milestones[milestones.length - 1];

  const segmentDivisor = Math.max(1, milestones.length - 1);

  const denom = nextMilestone.amount - prevMilestone.amount;
  // 🧠 Calculate progress between milestones
  const segmentProgress =
    denom <= 0
      ? 0
      : ((totalAmount - prevMilestone.amount) / denom) * (100 / segmentDivisor);

  const totalProgress =
    (currentIndex - 1) * (100 / segmentDivisor) +
    Math.min(segmentProgress, 100 / segmentDivisor);

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
