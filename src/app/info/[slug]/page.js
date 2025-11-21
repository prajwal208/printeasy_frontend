import InfoPageClient from "@/component/InfoPageClient/InfoPageClient";


export default async function InfoPage({ params }) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;

  return <InfoPageClient slug={slug} />;
}
