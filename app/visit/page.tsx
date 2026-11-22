import type { Metadata } from "next";
import Image from "next/image";
import { kitchenHoursLabel } from "@/lib/liveKitchen";
import { loadKitchenConfig } from "@/lib/liveKitchenStore";
import { OG_DEFAULTS } from "@/lib/seo";
import {
  SHOP_HOURS,
  SHOP_MAP_EMBED_URL,
  SHOP_MAP_URL,
  SITE_CITY,
  SITE_NAME,
  SITE_PHONE,
  SITE_PHONE_DISPLAY,
  SITE_POSTAL_CODE,
  SITE_REGION,
  SITE_STREET_ADDRESS,
  SITE_WHATSAPP_URL,
} from "@/lib/site";

export const revalidate = 604800;

const title = `Visit Us – Shahi Road, ${SITE_CITY} | ${SITE_NAME}`;
const description = `Find ${SITE_NAME} at ${SITE_STREET_ADDRESS}, ${SITE_CITY}: map, opening hours, Live Kitchen hours, phone and WhatsApp ${SITE_PHONE_DISPLAY}.`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/visit" },
  openGraph: { ...OG_DEFAULTS, title, description, url: "/visit" },
};

function clock(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 && h < 24 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m || 0).padStart(2, "0")} ${suffix}`;
}

export default async function VisitPage() {
  const kitchen = await loadKitchenConfig();
  const kitchenHours = kitchenHoursLabel(kitchen.hours);
  const row = "flex flex-col gap-0.5 border-b border-gold-200 py-3 last:border-0 sm:flex-row sm:gap-4";
  const label = "w-40 shrink-0 text-xs font-bold uppercase tracking-[0.14em] text-gold-700 sm:pt-0.5";

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-center">
        <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-maroon-900 shadow-lg sm:aspect-[16/10]">
          <Image
            src="/images/shop-exterior.webp"
            alt="Jallundhar Sweets & Bakers shop front on Shahi Road, Rahim Yar Khan"
            fill
            sizes="(min-width: 1024px) 60vw, 100vw"
            unoptimized
            className="object-cover"
            priority
          />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold-700">Find us in Rahim Yar Khan</p>
          <h1 className="mt-3 font-display text-3xl font-bold text-maroon-900 sm:text-4xl">Visit our shop</h1>
          <p className="mt-4 text-sm leading-relaxed text-maroon-700/75">
            We look forward to welcoming you for sweets, bakery treats and café favourites.
          </p>

          <dl className="mt-5 rounded-2xl bg-white px-4 shadow-sm ring-1 ring-gold-200">
            <div className={row}>
              <dt className={label}>Address</dt>
              <dd className="text-maroon-900">
                <address className="not-italic">
                  {SITE_NAME}
                  <br />
                  {SITE_STREET_ADDRESS}, {SITE_CITY} {SITE_POSTAL_CODE}
                  <br />
                  {SITE_REGION}, Pakistan
                </address>
              </dd>
            </div>
            <div className={row}>
              <dt className={label}>Shop hours</dt>
              <dd className="text-maroon-900">
                {SHOP_HOURS ? `Daily, ${clock(SHOP_HOURS.opens)} – ${clock(SHOP_HOURS.closes)}` : "Call us for today's timings"}
              </dd>
            </div>
            <div className={row}>
              <dt className={label}>Live Kitchen</dt>
              <dd className="text-maroon-900">Daily, {kitchenHours}</dd>
            </div>
            <div className={row}>
              <dt className={label}>Phone</dt>
              <dd>
                <a href={`tel:${SITE_PHONE}`} className="font-semibold text-maroon-900 underline underline-offset-2">
                  {SITE_PHONE_DISPLAY}
                </a>
              </dd>
            </div>
            <div className={row}>
              <dt className={label}>WhatsApp</dt>
              <dd>
                <a href={SITE_WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="font-semibold text-maroon-900 underline underline-offset-2">
                  {SITE_PHONE_DISPLAY} – send your order
                </a>
              </dd>
            </div>
          </dl>

          <div className="mt-6 flex flex-wrap gap-3">
            {SHOP_MAP_URL ? (
              <a href={SHOP_MAP_URL} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded-full bg-maroon-800 px-5 py-3 text-sm font-semibold text-white hover:bg-maroon-900">
                Open in Google Maps ↗
              </a>
            ) : null}
            <a href={`tel:${SITE_PHONE}`} className="inline-flex min-h-11 items-center rounded-full border border-gold-300 px-5 py-3 text-sm font-semibold text-maroon-800 hover:bg-gold-50">
              Call us
            </a>
            <a href={SITE_WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded-full border border-gold-300 px-5 py-3 text-sm font-semibold text-maroon-800 hover:bg-gold-50">
              WhatsApp us
            </a>
          </div>
        </div>
      </div>
      {SHOP_MAP_EMBED_URL ? (
        <div className="mt-10 overflow-hidden rounded-3xl border border-gold-200 shadow-sm">
          <iframe
            src={SHOP_MAP_EMBED_URL}
            title="Map: Jallundhar Sweets & Bakers, Shahi Road, Rahim Yar Khan"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="h-[360px] w-full border-0 sm:h-[460px]"
          />
        </div>
      ) : null}
    </main>
  );
}
