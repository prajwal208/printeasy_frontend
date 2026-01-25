import Script from "next/script";

export default function ProductSchema({ product }) {
  if (!product) return null;

  const price = product.discountedPrice || product.basePrice;

  return (
    <Script
      id={`product-schema-${product.id}`}
      type="application/ld+json"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org/",
          "@type": "Product",

          /* 🔴 REQUIRED BY META */
          "id": product.id,

          "name": product.name,
          "description": product.description,
          "sku": product.sku || product.id,

          "image": product.productImages,

          "brand": {
            "@type": "Brand",
            "name": "OnRise Store"
          },

          "offers": {
            "@type": "Offer",
            "url": `https://onrisestore.com/product/${product.slug}`,
            "priceCurrency": "INR",
            "price": price.toString(),
            "availability": product.isActive
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
            "itemCondition": "https://schema.org/NewCondition"
          }
        })
      }}
    />
  );
}
