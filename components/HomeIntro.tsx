import Link from "next/link";
import { jsonLdString } from "@/lib/seo";
import { SITE_CITY, SITE_NAME, SITE_PHONE_DISPLAY, SITE_URL, SITE_WHATSAPP_URL } from "@/lib/site";

const FAQS: { q: string; a: string }[] = [
  {
    q: "Which areas do you deliver to?",
    a: `We deliver to homes in ${SITE_CITY}. Send your address on WhatsApp (${SITE_PHONE_DISPLAY}) and we will confirm whether we can reach you.`,
  },
  {
    q: "How do I order a custom cake?",
    a: "Open the Custom Cakes section on our homepage, fill in the occasion, date, size and flavour, then continue on WhatsApp. You can share reference photos in the chat and we confirm the design, price and date with you.",
  },
  {
    q: "How much is the delivery charge?",
    a: "The delivery charge depends on your area. We confirm it on WhatsApp before your order is dispatched.",
  },
  {
    q: "How can I pay?",
    a: `Website orders are paid cash on delivery. For any other payment option, ask us on WhatsApp (${SITE_PHONE_DISPLAY}) when you place your order.`,
  },
  {
    q: "How do I place an order?",
    a: `Add items to your cart on this website and send the order, or message us on WhatsApp (${SITE_PHONE_DISPLAY}). You can also visit the shop on Shahi Road, ${SITE_CITY}.`,
  },
];

/** Homepage "About us" and FAQ (with FAQPage structured data). */
export default function HomeIntro() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${SITE_URL}/#faq`,
    mainEntity: FAQS.map((entry) => ({
      "@type": "Question",
      name: entry.q,
      acceptedAnswer: { "@type": "Answer", text: entry.a },
    })),
  };

  return (
    <section className="mx-auto max-w-6xl px-4 pb-10 pt-4 sm:px-6" aria-labelledby="about-us">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(faqJsonLd) }} />
      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gold-200 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold-700">Since 1959</p>
          <h2 id="about-us" className="mt-2 font-display text-2xl font-bold text-maroon-900 sm:text-3xl">
            About us
          </h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-maroon-800/85 sm:text-base">
            <p>
              {SITE_NAME} has served {SITE_CITY} from Shahi Road since 1959. Families come to us for mithai, bakery
              items and cakes for everyday treats, weddings, Eid and other celebrations.
            </p>
            <p>
              Today the shop also has a full general store and a Live Kitchen for pizza, burgers and snacks. You can
              visit us, order on this website, or send your order on{" "}
              <a href={SITE_WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="font-semibold text-maroon-900 underline underline-offset-2">
                WhatsApp
              </a>{" "}
              for home delivery in {SITE_CITY}.
            </p>
          </div>
          <Link href="/visit" className="mt-5 inline-flex text-sm font-semibold text-maroon-800 underline underline-offset-4 hover:text-maroon-900">
            Visit our shop →
          </Link>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gold-200 sm:p-8">
          <h2 className="font-display text-2xl font-bold text-maroon-900 sm:text-3xl">Frequently asked questions</h2>
          <div className="mt-4 divide-y divide-gold-200">
            {FAQS.map((entry) => (
              <details key={entry.q} className="group py-3">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold text-maroon-900">
                  <h3 className="text-sm sm:text-base">{entry.q}</h3>
                  <span className="text-gold-700 transition group-open:rotate-45" aria-hidden>
                    +
                  </span>
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-maroon-800/80">{entry.a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
