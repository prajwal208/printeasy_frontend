export const getApplicableRewards = (offerData, bagTotal) => {
  if (!offerData || offerData.length === 0)
    return { applicable: [], discount: 0, freeDelivery: false };

  let applicable = [];
  let discountAmount = 0;
  let freeDeliveryApplied = false;

  offerData.forEach((reward) => {
    if (bagTotal >= reward.minOrderAmount) {
      applicable.push(reward);

      if (reward.giftType === "discount") {
        if (reward.discountPercentage) {
          discountAmount = (bagTotal * reward.discountPercentage) / 100;
        } else if (reward.discountAmount) {
          discountAmount = reward.discountAmount;
        }
      }

      if (reward.giftType === "freeDelivery") {
        freeDeliveryApplied = true;
      }
    }
  });

  return { applicable, discount: discountAmount, freeDelivery: freeDeliveryApplied };
};
