import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

// Heavy SEO/AI crawlers that burn function CPU without sending customers.
const BLOCKED_BOTS = [
  "AhrefsBot", "SemrushBot", "MJ12bot", "DotBot", "PetalBot", "Bytespider",
  "GPTBot", "CCBot", "ClaudeBot", "anthropic-ai", "Amazonbot", "DataForSeoBot",
  "BLEXBot", "barkrowler", "SeekportBot", "serpstatbot", "Timpibot", "ImagesiftBot",
  "omgili", "Diffbot", "MegaIndex", "YandexBot", "Baiduspider", "Sogou",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: BLOCKED_BOTS, disallow: "/" },
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/account", "/admin", "/api/", "/hisab"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}