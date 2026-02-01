import PaymentClient from "@/component/PaymentClient/PaymentClient";
import { Suspense } from "react";


export default function Page() {
  return (
    <Suspense fallback={null}>
      <PaymentClient />
    </Suspense>
  );
}
