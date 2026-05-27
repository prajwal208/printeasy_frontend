export const productReviews = [
  {
    id: "rev_1",
    name: "Priya Sharma",
    initial: "P",
    color: "#FF6B6B",
    date: "12 May 2025",
    location: "Bangalore",
    rating: 5,
    title: "My son absolutely loved it! 🐯",
    text: 'Got "VEER KA SHER" printed and my 8 year old went crazy. Quality is really good — soft fabric, print hasn’t faded after 3 washes. Delivery in 3 days!',
    tags: ["Great Quality", "Fast Delivery", "True to Size"],
    helpfulCount: 32,
    hasPhotos: true,
    photos: ["👦", "👕"],
  },
  {
    id: "rev_2",
    name: "Rahul Nair",
    initial: "R",
    color: "#4ECDC4",
    date: "8 May 2025",
    location: "Chennai",
    rating: 4,
    title: "Great birthday gift!",
    text: 'Ordered "ARJUN THE TIGER" for my son’s 7th birthday. He wore it to school and all his friends wanted one 😂 Fabric feels premium. Highly recommend!',
    tags: ["Birthday Gift", "Good Fabric", "Kids Loved It"],
    helpfulCount: 18,
    hasPhotos: false,
    photos: [],
  },
  {
    id: "rev_3",
    name: "Ayesha Khan",
    initial: "A",
    color: "#6C5CE7",
    date: "2 May 2025",
    location: "Hyderabad",
    rating: 5,
    title: "Print quality is top notch",
    text: "The colors are vibrant and the fabric is super soft. Size was accurate as per chart. Will order again.",
    tags: ["Vibrant Print", "Soft Fabric"],
    helpfulCount: 11,
    hasPhotos: true,
    photos: ["🐯", "👧"],
  },
  {
    id: "rev_4",
    name: "Neha Gupta",
    initial: "N",
    color: "#F59E0B",
    date: "28 Apr 2025",
    location: "Delhi",
    rating: 3,
    title: "Good but delivery was late",
    text: "Product is nice, but delivery took longer than expected. Overall fine.",
    tags: ["Nice Product"],
    helpfulCount: 6,
    hasPhotos: false,
    photos: [],
  },
  {
    id: "rev_5",
    name: "Sanjay Mehta",
    initial: "S",
    color: "#10B981",
    date: "18 Apr 2025",
    location: "Pune",
    rating: 4,
    title: "Value for money",
    text: "Great at this price point. Stitching looks solid and the fit is comfortable for kids.",
    tags: ["Value", "Comfortable"],
    helpfulCount: 9,
    hasPhotos: true,
    photos: ["👦"],
  },
];

export function getReviewStats(reviews) {
  const list = Array.isArray(reviews) ? reviews : [];
  const total = list.length;
  if (total === 0) {
    return {
      total: 0,
      avg: 0,
      byStar: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      withPhotos: 0,
    };
  }

  const byStar = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let sum = 0;
  let withPhotos = 0;

  for (const r of list) {
    const rating = Math.max(1, Math.min(5, Number(r.rating) || 0));
    sum += rating;
    byStar[rating] = (byStar[rating] || 0) + 1;
    if (r.hasPhotos) withPhotos += 1;
  }

  return {
    total,
    avg: Math.round((sum / total) * 10) / 10,
    byStar,
    withPhotos,
  };
}

