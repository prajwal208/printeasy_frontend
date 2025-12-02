// app/category/page.jsx
import Link from "next/link";
import styles from "./categotyGrid.module.scss";
import CategoryCard from "@/component/CategoryCard/CategoryCard";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

const CategoryGridPage = async () => {
  let categories = [];

  try {
    const res = await fetch(`${apiUrl}/v1/categories/all`, {
      headers: {
        "x-api-key":
          "454ccaf106998a71760f6729e7f9edaf1df17055b297b3008ff8b65a5efd7c10",
      },
      cache: "force-cache",
    });

    const data = await res.json();
    categories = data?.data?.[0]?.collections || [];
  } catch (err) {
    console.error("Error fetching categories:", err);
  }

  return (
    <main className={styles.featured_categories}>
      <h3 className={styles.featured_cat}>FEATURED CATEGORIES</h3>
      <section className={styles.gridWrapper}>
        {categories.map((item) => (
          <Link
            key={item?.id}
            href={`/selectedcategory/${item?.id}`}
            passHref
          >
            <CategoryCard image={item.image} title={item.name} />
          </Link>
        ))}
      </section>
    </main>
  );
};

export default CategoryGridPage;
