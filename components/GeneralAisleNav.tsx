import CircleMenuGrid from "./CircleMenuGrid";
import { GENERAL_AISLES } from "@/lib/generalAisles";

export default function GeneralAisleNav() {
  return (
    <CircleMenuGrid
      flush
      items={GENERAL_AISLES.map((aisle) => ({
        href: `/general/${aisle.slug}`,
        name: aisle.name,
        image: aisle.image,
      }))}
    />
  );
}
