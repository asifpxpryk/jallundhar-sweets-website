const CATEGORIES = [
  { href: "#mithai", label: "Mithai", emoji: "🍬" },
  { href: "#bakery", label: "Bakery", emoji: "🥐" },
  { href: "#cakes", label: "Cakes", emoji: "🎂" },
  { href: "#cafe", label: "Cafe", emoji: "🍕" },
  { href: "#store", label: "Store", emoji: "🥤" },
  { href: "#deals", label: "Deals", emoji: "🏷️" },
];

export default function CategoryNav() {
  return (
    <div className="mx-auto max-w-6xl px-3 py-6 sm:px-6">
      <div className="grid grid-cols-6 gap-1 sm:flex sm:justify-center sm:gap-8">
        {CATEGORIES.map((cat) => (
          <a
            key={cat.href}
            href={cat.href}
            className="flex flex-col items-center gap-1.5 text-center sm:gap-2"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gold-50 text-lg shadow-sm ring-1 ring-gold-100 transition hover:bg-gold-100 sm:h-16 sm:w-16 sm:text-2xl">
              {cat.emoji}
            </span>
            <span className="text-[0.65rem] font-medium leading-tight text-maroon-700 sm:text-sm">
              {cat.label}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
