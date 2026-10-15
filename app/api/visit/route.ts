import { recordVisit } from "@/lib/siteVisits";

export const dynamic = "force-dynamic";

const ALLOWED_ORIGINS = new Set([
  "https://www.jallundharmain.com",
  "https://jallundharmain.com",
]);

export async function POST(request: Request) {
  const origin = request.headers.get("origin") || "";
  const local = origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:");
  if (!ALLOWED_ORIGINS.has(origin) && !local) return new Response(null, { status: 204 });

  let body: { path?: unknown; visitorId?: unknown };
  try {
    body = await request.json();
  } catch {
    return new Response(null, { status: 400 });
  }
  const path = typeof body.path === "string" ? body.path : "";
  const visitorId = typeof body.visitorId === "string" ? body.visitorId : "";
  if (!path.startsWith("/") || path.includes("?") || path.length > 200) {
    return new Response(null, { status: 400 });
  }
  try {
    await recordVisit(path, visitorId);
  } catch {
    return new Response(null, { status: 204 });
  }
  return new Response(null, { status: 204 });
}
