import type { Metadata } from "next";
import { notFound } from "next/navigation";
import OrderTracker from "@/components/OrderTracker";
import { parseOrderNumber } from "@/lib/orderTracking";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Track your order",
  robots: { index: false, follow: false },
};

export default function OrderTrackingPage({ params }: { params: { number: string } }) {
  const orderNumber = parseOrderNumber(params.number);
  if (!orderNumber) notFound();
  return (
    <main className="mx-auto max-w-xl px-4 pb-16 pt-6 sm:pt-10">
      <h1 className="font-display text-2xl font-bold text-maroon-900">Order #{orderNumber}</h1>
      <OrderTracker orderNumber={orderNumber} />
    </main>
  );
}
