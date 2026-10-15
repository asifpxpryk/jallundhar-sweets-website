import Link from "next/link";
import type { ReactNode } from "react";

const ctaClass =
  "mt-1.5 inline-flex min-h-11 w-fit items-center gap-2 rounded-full bg-maroon-800 px-4 text-[13px] font-semibold text-white transition hover:bg-maroon-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon-700 lg:mt-4 lg:px-5 lg:text-sm";

export default function HomePromoCard({
  id,
  label,
  title,
  description,
  href,
  cta,
  desktopSrc,
  mobileSrc,
  className = "",
}: {
  id: string;
  label: string;
  title: ReactNode;
  description: string;
  href: string;
  cta: string;
  desktopSrc: string;
  mobileSrc: string;
  className?: string;
}) {
  return (
    <section
      aria-labelledby={id}
      className={`relative overflow-hidden rounded-[22px] max-lg:mx-auto max-lg:max-w-[540px] ${className}`}
    >
      <picture>
        <source media="(min-width: 1024px)" srcSet={desktopSrc} width={1800} height={600} />
        <img
          src={mobileSrc}
          alt=""
          width={900}
          height={1200}
          loading="lazy"
          decoding="async"
          className="block h-auto w-full"
        />
      </picture>
      <div className="absolute inset-x-0 top-0 flex h-[33%] flex-col justify-center px-[5.5%] lg:inset-y-0 lg:left-[4%] lg:right-auto lg:h-auto lg:w-[37%] lg:px-0">
        <p className="text-[10px] font-bold uppercase leading-none tracking-[0.16em] text-gold-600 lg:text-[11px] lg:tracking-[0.18em]">{label}</p>
        <h2 id={id} className="mt-1 font-display text-[21px] font-bold leading-[1.08] text-maroon-900 sm:text-[23px] md:text-[26px] lg:mt-2 lg:text-[2rem] lg:leading-[1.12]">
          {title}
        </h2>
        <p className="mt-1 text-[12px] leading-tight text-maroon-800/90 sm:text-[13px] lg:mt-2 lg:text-sm lg:leading-snug">{description}</p>
        <Link href={href} className={ctaClass}>
          {cta}
          <span aria-hidden="true">{"\u2192"}</span>
        </Link>
      </div>
    </section>
  );
}
