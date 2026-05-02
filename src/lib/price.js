/** Bag subtotal using the same rules as the cart page (discount price × qty). */
export const sumCartBagTotal = (items) => {
  if (!items?.length) return 0;
  return items.reduce((sum, item) => {
    const price = Number(item.discountPrice) || 0;
    const qty = Number(item.quantity) || 1;
    return sum + price * qty;
  }, 0);
};

export const offerMinOrderAmount = (offer) => {
  if (!offer) return NaN;
  const raw =
    offer.minOrderAmount ??
    offer.min_order_amount ??
    offer.minOrder ??
    offer.min_order;
  const n = Number(raw);
  return Number.isNaN(n) ? NaN : n;
};

const ICON_FIELD_KEYS = [
  "icon",
  "icons",
  "offerIcon",
  "offer_icon",
  "offerIcons",
  "offer_icons",
  "giftIcon",
  "gift_icon",
  "badgeIcon",
  "badge_icon",
  "rewardIcon",
  "reward_icon",
];

const IMAGE_FIELD_KEYS = [
  "imageUrl",
  "image_url",
  "image",
  "iconUrl",
  "icon_url",
  "giftImage",
  "gift_image",
  "thumbnail",
  "photoUrl",
  "photo_url",
  "logo",
  "logoUrl",
  "logo_url",
  "bannerUrl",
  "banner_url",
  "bannerImage",
  "banner_image",
];

/** Normalize API payloads: arrays of URLs/objects, `{ url }`, JSON strings. */
export function coerceOfferMediaRaw(raw) {
  if (raw == null) return null;
  if (Array.isArray(raw)) {
    const parts = raw
      .map((item) => {
        if (item == null) return null;
        if (typeof item === "string") return item.trim();
        if (typeof item === "object") {
          const u =
            item.url ??
            item.src ??
            item.href ??
            item.icon ??
            item.image;
          return typeof u === "string" ? u.trim() : null;
        }
        return null;
      })
      .filter(Boolean);
    if (!parts.length) return null;
    return parts.join(",");
  }
  if (typeof raw === "object") {
    const u =
      raw.url ?? raw.src ?? raw.href ?? raw.icon ?? raw.image;
    if (typeof u === "string") return u.trim();
    return null;
  }
  if (typeof raw === "string") {
    const t = raw.trim();
    if (t.startsWith("[") && t.endsWith("]")) {
      try {
        return coerceOfferMediaRaw(JSON.parse(t));
      } catch {
        return raw;
      }
    }
    return raw;
  }
  return String(raw).trim();
}

function normalizeMediaUrl(segment) {
  if (!segment || typeof segment !== "string") return null;
  const s = segment.trim();
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) return s.replace(/[,|;]+$/, "");
  if (s.startsWith("//")) return `https:${s.replace(/[,|;]+$/, "")}`;
  if (s.startsWith("data:image")) return s;
  if (/\.(png|jpe?g|gif|webp|svg)(\?[^\s]*)?$/i.test(s)) return s;
  return null;
}

/** Pull first http(s) URL from a substring (handles `"label https://..."`). */
function extractUrlFromSegment(segment) {
  if (!segment || typeof segment !== "string") return null;
  const m = segment.trim().match(/https?:\/\/[^\s,|;]+/i);
  if (m) return m[0];
  const m2 = segment.trim().match(/^\/\/[^\s,|;]+/);
  if (m2) return `https:${m2[0]}`;
  return normalizeMediaUrl(segment.trim());
}

/**
 * Split combined icon strings (`url1,url2` or `delivery|discount`) and pick URL for this reward type.
 */
export function resolveSplitOfferMedia(raw, giftType) {
  if (raw == null) return null;
  const str = typeof raw === "string" ? raw.trim() : String(raw).trim();
  if (!str) return null;

  const segments = str.split(/[,|;]/).map((s) => s.trim()).filter(Boolean);
  const chunks = segments.length ? segments : [str];

  const urlsFromChunks = chunks
    .map((chunk) => extractUrlFromSegment(chunk))
    .filter(Boolean);

  if (urlsFromChunks.length === 0) {
    return extractUrlFromSegment(str);
  }
  if (urlsFromChunks.length === 1) {
    return normalizeMediaUrl(urlsFromChunks[0]);
  }

  const gt = giftType ?? "";
  if (gt === "discount") {
    const hinted = urlsFromChunks.find((u) =>
      /discount|percent|off|coupon|cashback/i.test(u)
    );
    return normalizeMediaUrl(
      hinted ?? urlsFromChunks[urlsFromChunks.length - 1]
    );
  }
  if (gt === "freeDelivery") {
    const hinted = urlsFromChunks.find((u) =>
      /deliver|ship|truck|free[-_]?ship/i.test(u)
    );
    return normalizeMediaUrl(hinted ?? urlsFromChunks[0]);
  }

  return normalizeMediaUrl(urlsFromChunks[0]);
}

function pickFirstResolvedMedia(offer, keys, giftType) {
  if (!offer) return null;
  for (const key of keys) {
    const raw = coerceOfferMediaRaw(offer[key]);
    const resolved = resolveSplitOfferMedia(raw, giftType);
    if (resolved) return resolved;
  }
  return null;
}

/** Prefer dedicated icon fields (split-aware), then general image URLs. */
export const getOfferVisualUrl = (offer) => {
  if (!offer) return null;
  const giftType = offer.giftType ?? offer.gift_type;
  return (
    pickFirstResolvedMedia(offer, ICON_FIELD_KEYS, giftType) ??
    pickFirstResolvedMedia(offer, IMAGE_FIELD_KEYS, giftType)
  );
};

/** Legacy helper: same resolution pipeline as visuals (icons + images). */
export const getOfferImageUrl = (offer) => getOfferVisualUrl(offer);

/**
 * Next reward the bag has not reached yet: lowest `minOrderAmount` where bag < threshold.
 */
export const getNextUnlockableOffer = (offerData, bagTotal) => {
  const bag = Number(bagTotal) || 0;
  if (!offerData?.length) {
    return {
      nextOffer: null,
      amountMore: null,
      nextThreshold: null,
      allUnlocked: false,
      hasAnyOffer: false,
    };
  }

  const locked = offerData
    .map((o) => ({ offer: o, min: offerMinOrderAmount(o) }))
    .filter(({ min }) => !Number.isNaN(min) && min > 0 && bag < min);

  if (!locked.length) {
    return {
      nextOffer: null,
      amountMore: null,
      nextThreshold: null,
      allUnlocked: true,
      hasAnyOffer: true,
    };
  }

  locked.sort((a, b) => {
    if (a.min !== b.min) return a.min - b.min;
    const idA = a.offer?.id ?? "";
    const idB = b.offer?.id ?? "";
    return String(idA).localeCompare(String(idB));
  });

  const { offer: nextOffer, min } = locked[0];
  return {
    nextOffer,
    amountMore: Math.max(0, Math.ceil(min - bag)),
    nextThreshold: min,
    allUnlocked: false,
    hasAnyOffer: true,
  };
};

export const getApplicableRewards = (offerData, bagTotal) => {
  if (!offerData || offerData.length === 0)
    return { applicable: [], discount: 0, freeDelivery: false };

  let applicable = [];
  let discountAmount = 0;
  let freeDeliveryApplied = false;

  offerData.forEach((reward) => {
    const min = offerMinOrderAmount(reward);
    if (Number.isNaN(min) || bagTotal < min) return;

    applicable.push(reward);

    const giftType = reward.giftType ?? reward.gift_type;
    if (giftType === "discount") {
      if (reward.discountPercentage) {
        discountAmount = (bagTotal * reward.discountPercentage) / 100;
      } else if (reward.discountAmount) {
        discountAmount = reward.discountAmount;
      }
    }

    if (giftType === "freeDelivery") {
      freeDeliveryApplied = true;
    }
  });

  return { applicable, discount: discountAmount, freeDelivery: freeDeliveryApplied };
};
