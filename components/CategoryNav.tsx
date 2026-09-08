import CircleMenuGrid from "./CircleMenuGrid";
import { SECTIONS } from "@/lib/sections";

export default function CategoryNav() {
  return (
    <div id="categories">
      <CircleMenuGrid
        columns={6}
        items={SECTIONS.map((cat) => ({
          href: `/${cat.slug}`,
          name: cat.name,
          image: cat.image,
        }))}
      />
    </div>
  );
}
