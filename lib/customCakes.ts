export const CAKE_WHATSAPP = "https://wa.me/923001538440";

export type CakeDesign = {
  id: string;
  title: string;
  src: string;
  alt: string;
  width: number;
  height: number;
};

/** Gallery stills copied from the shop's special-cake photos. Originals stay on the shop drive. */
export const CAKE_DESIGNS: CakeDesign[] = [
  {
    id: "special-cake-1",
    title: "Happy Birthday Dad",
    src: "/custom-cakes/special-cake-1.webp",
    alt: "White cake with a Happy Birthday Dad topper and a stop-smoking message.",
    width: 1200,
    height: 1200,
  },
  {
    id: "special-cake-2",
    title: "Umrah Mubarak",
    src: "/custom-cakes/special-cake-2.webp",
    alt: "White Umrah Mubarak cake with a figure in white, prayer beads, and a Makkah signpost.",
    width: 1200,
    height: 1200,
  },
  {
    id: "special-cake-3",
    title: "First birthday",
    src: "/custom-cakes/special-cake-3.webp",
    alt: "Pale yellow first-birthday cake with a teddy, balloons, and a number one topper.",
    width: 1200,
    height: 1200,
  },
  {
    id: "special-cake-4",
    title: "Car birthday",
    src: "/custom-cakes/special-cake-4.webp",
    alt: "Blue and white birthday cake with cars, clouds, the name Adhi, and a number two.",
    width: 1200,
    height: 1200,
  },
  {
    id: "special-cake-5",
    title: "Teddy birthday",
    src: "/custom-cakes/special-cake-5.webp",
    alt: "Cream and green birthday cake with a teddy in a party hat and a heart balloon.",
    width: 1200,
    height: 1200,
  },
];

export function cakeDesign(id: string | null) {
  return CAKE_DESIGNS.find((design) => design.id === id) ?? null;
}
