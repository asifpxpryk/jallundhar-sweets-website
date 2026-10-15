import type { Metadata } from "next";
import Link from "next/link";
import { OG_DEFAULTS } from "@/lib/seo";
import { SITE_CITY, SITE_NAME, SITE_PHONE_DISPLAY, SITE_STREET_ADDRESS } from "@/lib/site";

const TITLE = `Return & Refund Policy | ${SITE_NAME}, ${SITE_CITY}`;
const DESCRIPTION = `Returns, refunds and cancellations at ${SITE_NAME}, ${SITE_STREET_ADDRESS}, ${SITE_CITY}. Report damaged, spoiled or wrong items within 24 hours on WhatsApp ${SITE_PHONE_DISPLAY} for a replacement or refund.`;
const WHATSAPP_URL = "https://wa.me/923001538440";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/return-policy" },
  openGraph: { ...OG_DEFAULTS, title: TITLE, description: DESCRIPTION, url: "/return-policy" },
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-xl font-bold text-maroon-900 sm:text-2xl">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-maroon-800/85 sm:text-base">{children}</div>
    </section>
  );
}

export default function ReturnPolicyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold-700">Customer care</p>
      <h1 className="mt-3 font-display text-3xl font-bold text-maroon-900 sm:text-4xl">Return &amp; Refund Policy</h1>
      <p className="mt-2 text-sm text-maroon-700/70">Last updated: 8 October 2026</p>

      <div className="mt-6 rounded-3xl border border-gold-200 bg-white/70 p-5 text-sm leading-relaxed text-maroon-800 shadow-sm sm:p-6 sm:text-base">
        <p>
          <strong>{SITE_NAME}</strong>
          <br />
          {SITE_STREET_ADDRESS}, {SITE_CITY}, Punjab, Pakistan
          <br />
          WhatsApp / Phone:{" "}
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="font-semibold text-maroon-900 underline underline-offset-4">
            {SITE_PHONE_DISPLAY}
          </a>
        </p>
      </div>

      <p
        lang="ur"
        dir="rtl"
        className="mt-6 rounded-2xl bg-gold-50 px-5 py-4 text-right text-base leading-loose text-maroon-900"
      >
        مٹھائی، بیکری اور کھانے کی اشیاء جلد خراب ہونے والی ہیں، اس لیے ڈیلیوری یا وصولی کے بعد واپس یا تبدیل نہیں ہوتیں۔ خراب، ٹوٹی ہوئی یا غلط چیز کی اطلاع 24 گھنٹے کے اندر واٹس ایپ 0300 1538440 پر دیں، ہم چیز بدل دیں گے یا رقم واپس کر دیں گے۔
      </p>

      <Section title="Perishable food items">
        <p>
          Sweets (mithai), bakery and other food items are perishable. For hygiene and food-safety reasons they cannot
          be returned or exchanged once they have been delivered or collected, except in the cases below.
        </p>
      </Section>

      <Section title="Damaged, spoiled or wrong items">
        <p>
          If an item arrives damaged or spoiled, or you received the wrong item, please tell us within{" "}
          <strong>24 hours</strong> of delivery or pickup on WhatsApp{" "}
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="font-semibold text-maroon-900 underline underline-offset-4">
            {SITE_PHONE_DISPLAY}
          </a>{" "}
          with your order details and a photo of the item.
        </p>
        <p>
          We will either replace the item or refund the amount. Refunds are made to the original payment method or in
          cash, within <strong>7 days</strong>.
        </p>
      </Section>

      <Section title="Packaged third-party items">
        <p>
          Packaged items from other brands (for example drinks and general store items) can be returned within{" "}
          <strong>3 days</strong> with the receipt, as long as they are unopened and in their original condition.
        </p>
      </Section>

      <Section title="Cancellations">
        <p>Orders can be cancelled before they are prepared or dispatched.</p>
        <p>Custom cake orders cannot be cancelled once preparation has started.</p>
      </Section>

      <Section title="Return shipping">
        <p>
          Return shipping is free for damaged or wrong items: we will collect the item from you or deliver a
          replacement at no extra cost.
        </p>
      </Section>

      <Section title="Contact us">
        <p>
          For any question about an order, returns or refunds, message or call us on {SITE_PHONE_DISPLAY}, or{" "}
          <Link href="/visit" className="font-semibold text-maroon-900 underline underline-offset-4">
            visit our shop
          </Link>{" "}
          at {SITE_STREET_ADDRESS}, {SITE_CITY}.
        </p>
      </Section>
    </main>
  );
}
