import Link from "next/link";
import styles from "./LoosePackBanner.module.css";

export default function LoosePackBanner({ href, eyebrow, title, text, cta, desktopImage, mobileImage, urdu }: {
  href: string;
  eyebrow: string;
  title: string;
  text: string;
  cta: string;
  desktopImage: string;
  mobileImage: string;
  urdu?: string;
}) {
  return (
    <div className={styles.container}>
      <Link href={href} className={`${styles.banner} group relative block overflow-hidden rounded-3xl bg-cream ring-1 ring-gold-200 transition hover:ring-maroon-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon-700`}>
        <picture className="absolute inset-0">
          <source media="(min-width: 1024px)" srcSet={desktopImage} width={1800} height={600} />
          <img src={mobileImage} alt="" width={900} height={1404} loading="lazy" decoding="async" className="h-full w-full object-cover" />
        </picture>
        <span className="absolute inset-x-0 top-0 z-10 flex h-[46%] flex-col justify-center px-5 py-5 sm:px-8 lg:inset-y-0 lg:right-auto lg:h-auto lg:w-[44%] lg:py-5">
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold-600">{eyebrow}</span>
          <span className="mt-1.5 font-display text-[27px] font-bold leading-[1.12] text-maroon-900">{title}</span>
          {urdu ? <span lang="ur" dir="rtl" className="mt-2 w-fit text-2xl leading-relaxed text-maroon-800" style={{ fontFamily: '"Noto Nastaliq Urdu", "Urdu Typesetting", "Noto Naskh Arabic", serif' }}>{urdu}</span> : null}
          <span className="mt-2 max-w-md text-sm leading-snug text-maroon-800/90">{text}</span>
          <span className="mt-4 inline-flex min-h-11 w-fit items-center gap-2 rounded-full bg-maroon-800 px-5 text-sm font-semibold text-white transition group-hover:bg-maroon-900">{cta}<span aria-hidden="true">{"\u2192"}</span></span>
        </span>
      </Link>
    </div>
  );
}
