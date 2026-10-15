import { createClient } from "@supabase/supabase-js";

const BUCKET = "site-visits";
const PKT = "+05:00";

export type VisitCount = { pageviews: number; visitors: number };

export type TopPage = VisitCount & { path: string };

export type VisitReport = {
  today: VisitCount;
  week: VisitCount;
  month: VisitCount;
  topPages: TopPage[];
  updatedAt: string;
};

type DayHits = {
  visitors: Set<string>;
  pageviews: number;
  paths: Map<string, { visitors: Set<string>; pageviews: number }>;
};

export function pakistanYmd(now: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Karachi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function shiftYmd(ymd: string, days: number) {
  const date = new Date(`${ymd}T12:00:00${PKT}`);
  date.setTime(date.getTime() + days * 86_400_000);
  return pakistanYmd(date);
}

export function visitDays(now = new Date()) {
  const today = pakistanYmd(now);
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Karachi",
    weekday: "short",
  }).format(now);
  const weekdayIndex: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  const daysSinceMonday = ((weekdayIndex[weekday] ?? 1) + 6) % 7;
  const weekStart = shiftYmd(today, -daysSinceMonday);
  const monthStart = `${today.slice(0, 8)}01`;
  const days: string[] = [];
  for (let ymd = monthStart; ymd <= today; ymd = shiftYmd(ymd, 1)) days.push(ymd);
  return { today, weekStart, monthStart, days };
}

function encodePath(path: string) {
  return Buffer.from(path, "utf8").toString("base64url");
}

function decodePath(value: string) {
  try {
    const path = Buffer.from(value, "base64url").toString("utf8");
    if (!path.startsWith("/") || path.length > 200) return "";
    return path;
  } catch {
    return "";
  }
}

let bucketReady = false;

function visitsClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret =
    process.env.SUPABASE_SECRET_KEY?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !secret) throw new Error("Missing SUPABASE_SECRET_KEY");
  return createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
    },
  });
}

async function ensureBucket() {
  if (bucketReady) return;
  const supabase = visitsClient();
  const { error } = await supabase.storage.createBucket(BUCKET, { public: false });
  if (error && !/already exists/i.test(error.message)) throw error;
  bucketReady = true;
}

export async function recordVisit(path: string, visitorId: string) {
  if (!/^\/(?!hisab$|admin|account|api(?:\/|$))/.test(path)) return;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(visitorId)) return;
  await ensureBucket();
  const ymd = pakistanYmd(new Date());
  const nonce = Math.random().toString(36).slice(2, 10);
  const name = `${ymd}/${visitorId}.${encodePath(path)}.${nonce}`;
  const supabase = visitsClient();
  const { error } = await supabase.storage.from(BUCKET).upload(name, "{}", {
    contentType: "application/json",
    upsert: false,
  });
  if (error) throw error;
}

async function listDay(ymd: string) {
  const supabase = visitsClient();
  const names: string[] = [];
  for (let offset = 0; offset < 20000; offset += 1000) {
    const { data, error } = await supabase.storage.from(BUCKET).list(ymd, {
      limit: 1000,
      offset,
      sortBy: { column: "name", order: "asc" },
    });
    if (error) {
      if (/not found|does not exist/i.test(error.message)) return [];
      throw error;
    }
    if (!data?.length) break;
    for (const file of data) {
      if (file.name?.includes(".")) names.push(file.name);
    }
    if (data.length < 1000) break;
  }
  return names;
}

function addHit(day: DayHits, name: string) {
  const [visitorId, pathCode] = name.split(".");
  const path = decodePath(pathCode || "");
  if (!visitorId || !path || path === "/hisab") return;
  day.visitors.add(visitorId);
  day.pageviews += 1;
  const page = day.paths.get(path) ?? { visitors: new Set<string>(), pageviews: 0 };
  page.visitors.add(visitorId);
  page.pageviews += 1;
  day.paths.set(path, page);
}

function countDays(hits: Map<string, DayHits>, from: string, to: string): VisitCount {
  const visitors = new Set<string>();
  let pageviews = 0;
  for (const [ymd, day] of hits) {
    if (ymd < from || ymd > to) continue;
    pageviews += day.pageviews;
    for (const visitor of day.visitors) visitors.add(visitor);
  }
  return { pageviews, visitors: visitors.size };
}

export async function loadVisitReport(now = new Date()): Promise<VisitReport> {
  const range = visitDays(now);
  const hits = new Map<string, DayHits>();
  await Promise.all(
    range.days.map(async (ymd) => {
      const day: DayHits = { visitors: new Set(), pageviews: 0, paths: new Map() };
      for (const name of await listDay(ymd)) addHit(day, name);
      hits.set(ymd, day);
    })
  );

  const monthPaths = new Map<string, { visitors: Set<string>; pageviews: number }>();
  for (const day of hits.values()) {
    for (const [path, page] of day.paths) {
      const all = monthPaths.get(path) ?? { visitors: new Set<string>(), pageviews: 0 };
      for (const visitor of page.visitors) all.visitors.add(visitor);
      all.pageviews += page.pageviews;
      monthPaths.set(path, all);
    }
  }
  const topPages = [...monthPaths.entries()]
    .map(([path, page]) => ({
      path,
      visitors: page.visitors.size,
      pageviews: page.pageviews,
    }))
    .sort((a, b) => b.visitors - a.visitors || b.pageviews - a.pageviews)
    .slice(0, 8);

  return {
    today: countDays(hits, range.today, range.today),
    week: countDays(hits, range.weekStart, range.today),
    month: countDays(hits, range.monthStart, range.today),
    topPages,
    updatedAt: new Intl.DateTimeFormat("en-PK", {
      timeZone: "Asia/Karachi",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(now),
  };
}

