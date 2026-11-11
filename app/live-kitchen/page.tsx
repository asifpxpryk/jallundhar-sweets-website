import LiveKitchenMenu from "@/components/LiveKitchenMenu";
import { kitchenHoursLabel, visibleKitchenGroups } from "@/lib/liveKitchen";
import { loadKitchenConfig } from "@/lib/liveKitchenStore";
import { OG_DEFAULTS } from "@/lib/seo";

export const revalidate = 604800;

const TITLE = "Live Kitchen – Fresh Pizza, Paratha Rolls, Wraps & Sandwiches | Jallundhar Rahim Yar Khan";
const DESCRIPTION =
  "Jallundhar Live Kitchen on Shahi Road, Rahim Yar Khan: pizza in three sizes, paratha rolls, wraps and sandwiches cooked to order. Order on WhatsApp.";

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/live-kitchen" },
  openGraph: { ...OG_DEFAULTS, title: TITLE, description: DESCRIPTION, url: "/live-kitchen" },
};

export default async function LiveKitchenPage() {
  const config = await loadKitchenConfig();
  return (
    <LiveKitchenMenu
      menu={visibleKitchenGroups(config.groups)}
      hours={config.hours}
      hoursLabel={kitchenHoursLabel(config.hours)}
    />
  );
}
