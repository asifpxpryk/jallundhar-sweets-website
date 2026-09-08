export type CircleMenuEntry = {
  href: string;
  name: string;
  image?: string;
};

export function CircleMenuItem({ href, name, image }: CircleMenuEntry) {
  return (
    <a href={href} className="relative z-10 flex cursor-pointer flex-col items-center gap-1 text-center">
      <span className="flex h-24 w-24 items-center justify-center rounded-full bg-[#fff8f0] p-[3px] shadow-sm ring-1 ring-gold-300 transition hover:ring-gold-500 sm:h-24 sm:w-24 lg:h-28 lg:w-28">
        <span className="flex h-full w-full items-center justify-center overflow-hidden rounded-full ring-1 ring-gold-200">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={encodeURI(image)} alt="" className="h-full w-full object-contain" />
          ) : (
            <span className="h-full w-full rounded-full bg-cream" />
          )}
        </span>
      </span>
      <span className="text-sm font-semibold leading-tight text-maroon-800 sm:text-base">{name}</span>
    </a>
  );
}

export default function CircleMenuGrid({
  items,
  columns = 3,
  flush = false,
}: {
  items: CircleMenuEntry[];
  columns?: 3 | 6;
  flush?: boolean;
}) {
  const colClass = columns === 6 ? "grid-cols-3 sm:grid-cols-6 sm:flex sm:justify-center" : "grid-cols-3";

  return (
    <div className={flush ? "mt-6" : "mx-auto max-w-6xl px-3 py-2 sm:px-6 sm:py-3"}>
      <div className={`grid gap-x-3 gap-y-4 sm:gap-x-8 sm:gap-y-5 ${colClass}`}>
        {items.map((item) => (
          <CircleMenuItem key={item.href} {...item} />
        ))}
      </div>
    </div>
  );
}
