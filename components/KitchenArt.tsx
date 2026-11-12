import type { KitchenGroupKey } from "@/lib/liveKitchen";

/** Small flat illustrations for the Live Kitchen menu, used until real food photos are added. */
export default function KitchenArt({ kind, className }: { kind: KitchenGroupKey; className?: string }) {
  if (kind === "pizza") {
    return (
      <svg viewBox="0 0 100 100" className={className} aria-hidden>
        <circle cx="50" cy="50" r="46" fill="#d98a3a" />
        <circle cx="50" cy="50" r="39" fill="#f6c24a" />
        <circle cx="50" cy="50" r="39" fill="none" stroke="#e8a531" strokeWidth="2" />
        <g stroke="#e3a02c" strokeWidth="1.5" opacity="0.7">
          <path d="M50 11v78M11 50h78M22.500 22.5l55 55M77.500 22.5l-55 55" />
        </g>
        <g fill="#c8371f">
          <circle cx="36" cy="30" r="6" />
          <circle cx="64" cy="34" r="6" />
          <circle cx="29" cy="56" r="6" />
          <circle cx="52" cy="52" r="6" />
          <circle cx="70" cy="60" r="6" />
          <circle cx="45" cy="73" r="6" />
        </g>
        <g fill="#3f7d2c">
          <path d="M48 24c4-2 8 0 9 3-4 2-8 0-9-3ZM22 42c3-3 7-2 9 1-3 3-7 2-9-1ZM60 76c3-3 8-2 9 1-3 3-7 2-9-1ZM72 45c3-2 7-1 8 2-3 2-7 1-8-2Z" />
        </g>
        <g fill="#2a1a14">
          <circle cx="42" cy="44" r="2.2" />
          <circle cx="60" cy="47" r="2.2" />
          <circle cx="37" cy="66" r="2.2" />
          <circle cx="58" cy="66" r="2.2" />
        </g>
      </svg>
    );
  }

  if (kind === "paratha-roll") {
    return (
      <svg viewBox="0 0 100 100" className={className} aria-hidden>
        <g transform="rotate(-35 50 50)">
          <rect x="12" y="34" width="76" height="32" rx="16" fill="#e9b765" />
          <rect x="12" y="34" width="76" height="32" rx="16" fill="none" stroke="#c98d3c" strokeWidth="2" />
          <g fill="#c98d3c" opacity="0.6">
            <circle cx="30" cy="44" r="2.5" />
            <circle cx="44" cy="56" r="2.5" />
            <circle cx="56" cy="43" r="2" />
            <circle cx="24" cy="57" r="2" />
          </g>
          <ellipse cx="86" cy="50" rx="7" ry="14" fill="#7a3b1c" />
          <circle cx="86" cy="44" r="3.5" fill="#c8371f" />
          <circle cx="87" cy="53" r="3.5" fill="#4c8f33" />
          <circle cx="84" cy="59" r="2.5" fill="#f4d98d" />
          <path d="M12 38h30v24H12a14 14 0 0 1 0-24Z" fill="#fff3e2" />
          <path d="M42 38v24" stroke="#e2452b" strokeWidth="3" />
          <path d="M34 38v24" stroke="#e2452b" strokeWidth="1.5" opacity="0.5" />
        </g>
      </svg>
    );
  }

  if (kind === "wraps") {
    return (
      <svg viewBox="0 0 100 100" className={className} aria-hidden>
        <g transform="rotate(20 50 50)">
          <path d="M30 14h40l-6 72a6 6 0 0 1-6 5H42a6 6 0 0 1-6-5L30 14Z" fill="#f1dcae" stroke="#d2b274" strokeWidth="2" />
          <ellipse cx="50" cy="15" rx="20" ry="8" fill="#5a2c14" />
          <path d="M33 13c3-7 8-4 10-8 3 5 8 2 10 6 3-5 9-3 13 3" fill="#57a03a" />
          <circle cx="42" cy="15" r="4" fill="#e2452b" />
          <circle cx="56" cy="16" r="4" fill="#f6c24a" />
          <circle cx="49" cy="12" r="3" fill="#c8371f" />
          <path d="M36 52l28-6M37 66l25-5" stroke="#d2b274" strokeWidth="2" opacity="0.7" />
          <path d="M35 58h30l-2 28a6 6 0 0 1-6 5H43a6 6 0 0 1-6-5l-2-28Z" fill="#ff9d3c" opacity="0.9" />
        </g>
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <path d="M10 76 50 18l40 58Z" fill="#f0c987" stroke="#c98d3c" strokeWidth="2" strokeLinejoin="round" />
      <path d="M14 82h72l4-6H10Z" fill="#57a03a" />
      <path d="M12 88h76l-2-6H14Z" fill="#c8371f" />
      <path d="M10 96h80l-2-8H12Z" fill="#f6c24a" />
      <path d="M8 96h84v2a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4Z" fill="#e2b06a" stroke="#c98d3c" strokeWidth="1.5" transform="translate(0 -6)" />
      <g fill="#c98d3c" opacity="0.55">
        <circle cx="50" cy="42" r="2.5" />
        <circle cx="40" cy="58" r="2.5" />
        <circle cx="60" cy="60" r="2.5" />
        <circle cx="50" cy="68" r="2" />
      </g>
    </svg>
  );
}
