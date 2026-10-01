import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { createClient } from "@supabase/supabase-js";

const appData = process.env.APPDATA;
if (!appData) throw new Error("APPDATA is missing");
const posDir = path.join(appData, "com.pospro.shop.hub");
const backupDir = path.join(posDir, "POS Pro POS Data Backups");
const latestBackup = fs.readdirSync(backupDir)
  .filter((name) => name.startsWith("pos-data-hourly-") && name.endsWith(".posbackup.json"))
  .sort()
  .at(-1);
if (!latestBackup) throw new Error("No POS Pro backup found");

const backup = JSON.parse(fs.readFileSync(path.join(backupDir, latestBackup), "utf8"));
const posProducts = backup.stores.products.filter(
  (product) => product.status === "active" && product.sellable !== false
);
const categories = new Map(backup.stores.categories.map((category) => [category.id, category.name]));

const hub = new DatabaseSync(path.join(posDir, "pos-shop-hub.sqlite3"), { readOnly: true });
const hubProducts = hub.prepare("select id, name, code, status from hub_catalog_products").all();
hub.close();
const hubById = new Map(hubProducts.map((product) => [product.id, product]));
const hubDifferences = backup.stores.products.filter((product) => {
  const row = hubById.get(product.id);
  return !row || row.name !== product.name || row.code !== product.code || row.status !== product.status;
}).length;
if (hubDifferences || hubProducts.length !== backup.stores.products.length) {
  throw new Error(`POS backup and hub SQLite differ on ${hubDifferences} products`);
}

const env = Object.fromEntries(
  fs.readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => {
      const separator = line.indexOf("=");
      return [line.slice(0, separator), line.slice(separator + 1).trim().replace(/^"|"$/g, "")];
    })
);
const website = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

function normalize(name) {
  return String(name || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\b7\s+up\b/g, "7up")
    .replace(/(\d+(?:\.\d+)?)\s*(litres?|liters?|ltr|ltrs)\b/g, "$1l")
    .replace(/(\d+(?:\.\d+)?)\s*(kilograms?|kgs?)\b/g, "$1kg")
    .replace(/(\d+(?:\.\d+)?)\s*(grams?|gms?)\b/g, "$1g")
    .replace(/(\d+(?:\.\d+)?)\s*(millilitres?|milliliters?|mls?)\b/g, "$1ml")
    .replace(/[^\p{L}\p{N}.]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenKey(name) {
  return normalize(name).split(" ").filter(Boolean).sort().join(" ");
}

function numberSignature(name) {
  return normalize(name).match(/\d+(?:\.\d+)?(?:kg|g|ml|l)?/g)?.sort().join("|") || "";
}

function dice(a, b) {
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;
  const grams = new Map();
  for (let i = 0; i < a.length - 1; i++) {
    const gram = a.slice(i, i + 2);
    grams.set(gram, (grams.get(gram) || 0) + 1);
  }
  let intersection = 0;
  for (let i = 0; i < b.length - 1; i++) {
    const gram = b.slice(i, i + 2);
    const available = grams.get(gram) || 0;
    if (available) {
      intersection++;
      grams.set(gram, available - 1);
    }
  }
  return (2 * intersection) / (a.length + b.length - 2);
}

function csvRow(values) {
  return values.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(",");
}

async function main() {
  const menu = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await website.from("menu_items")
      .select("id,name,price,category_id,is_available,is_hidden,description")
      .range(offset, offset + 999);
    if (error) throw error;
    menu.push(...data);
    if (data.length < 1000) break;
  }
  const configRow = menu.find((row) => row.id === "store-visibility-config");
  const config = configRow?.description ? JSON.parse(configRow.description) : {};
  const hiddenIds = new Set(config.hiddenItemIds || []);
  const websiteProducts = menu.filter((row) => row.id !== "store-visibility-config");
  const exact = new Map();
  const reordered = new Map();
  const tokenIndex = new Map();
  for (const item of websiteProducts) {
    const normalized = normalize(item.name);
    if (!exact.has(normalized)) exact.set(normalized, []);
    exact.get(normalized).push(item);
    const sorted = tokenKey(item.name);
    if (!reordered.has(sorted)) reordered.set(sorted, []);
    reordered.get(sorted).push(item);
    for (const token of new Set(normalized.split(" "))) {
      if (token.length < 3) continue;
      if (!tokenIndex.has(token)) tokenIndex.set(token, new Set());
      tokenIndex.get(token).add(item);
    }
  }

  const results = [];
  for (const product of posProducts) {
    const normalized = normalize(product.name);
    let match = exact.get(normalized)?.[0];
    let status = match ? "matched_name" : "";
    if (!match) {
      match = reordered.get(tokenKey(product.name))?.[0];
      if (match) status = "matched_token_order";
    }
    let score = "";
    if (!match) {
      const candidates = new Set();
      for (const token of normalized.split(" ")) {
        for (const candidate of tokenIndex.get(token) || []) candidates.add(candidate);
      }
      let best = null;
      let bestScore = 0;
      for (const candidate of candidates) {
        if (numberSignature(candidate.name) !== numberSignature(product.name)) continue;
        const similarity = dice(normalized, normalize(candidate.name));
        if (similarity > bestScore) {
          bestScore = similarity;
          best = candidate;
        }
      }
      if (best && bestScore >= 0.78) {
        match = best;
        score = bestScore.toFixed(2);
        status = "possible_match_review";
      } else {
        status = "no_name_match";
      }
    }
    results.push({
      pos_id: product.id,
      pos_code: product.code,
      barcode: product.barcode,
      pos_name: product.name,
      pos_category: categories.get(product.categoryId) || product.category || "",
      pos_sale_price: product.salePrice,
      match_status: status,
      website_id: match?.id || "",
      website_name: match?.name || "",
      website_price: match?.price ?? "",
      website_hidden: match ? Boolean(match.is_hidden || hiddenIds.has(match.id) || match.is_available === false) : "",
      similarity: score,
    });
  }

  results.sort((a, b) => a.pos_category.localeCompare(b.pos_category) || a.pos_name.localeCompare(b.pos_name));
  const missing = results.filter((row) => row.match_status === "possible_match_review" || row.match_status === "no_name_match");
  const counts = Object.fromEntries(["matched_name", "matched_token_order", "possible_match_review", "no_name_match"]
    .map((status) => [status, results.filter((row) => row.match_status === status).length]));
  const matchedButHidden = results.filter((row) => row.match_status.startsWith("matched") && row.website_hidden).length;
  const byCategory = new Map();
  for (const row of results) {
    const entry = byCategory.get(row.pos_category) || { total: 0, matched: 0, review: 0, missing: 0 };
    entry.total++;
    if (row.match_status.startsWith("matched")) entry.matched++;
    else if (row.match_status === "possible_match_review") entry.review++;
    else entry.missing++;
    byCategory.set(row.pos_category, entry);
  }

  const reportDir = path.join("reports", "pos-website-comparison");
  fs.mkdirSync(reportDir, { recursive: true });
  const columns = ["pos_id", "pos_code", "barcode", "pos_name", "pos_category", "pos_sale_price", "match_status", "website_id", "website_name", "website_price", "website_hidden", "similarity"];
  const writeCsv = (file, rows) => fs.writeFileSync(path.join(reportDir, file), "\uFEFF" + [csvRow(columns), ...rows.map((row) => csvRow(columns.map((key) => row[key])))].join("\r\n"), "utf8");
  writeCsv("all-active-sellable-products.csv", results);
  writeCsv("not-confidently-matched.csv", missing);

  const categoryLines = [...byCategory].sort((a, b) => b[1].missing + b[1].review - a[1].missing - a[1].review)
    .map(([category, value]) => `| ${category.replaceAll("|", "\\|")} | ${value.total} | ${value.matched} | ${value.review} | ${value.missing} |`);
  const markdown = [
    "# POS Pro aur website product comparison",
    "",
    `POS source: ${latestBackup} (${backup.meta.createdAt}); hub SQLite ke ${hubProducts.length} product records se cross-check kiya.`,
    `Website source: ${env.NEXT_PUBLIC_SUPABASE_URL}/menu_items; ${websiteProducts.length} product rows.`,
    "",
    `Active, sellable POS products: **${posProducts.length}**`,
    `Naam se matched: **${counts.matched_name + counts.matched_token_order}**`,
    `Matched magar item-level hidden/unavailable: **${matchedButHidden}**`,
    `Mumkin match, manual review: **${counts.possible_match_review}**`,
    `Koi qareebi naam match nahin: **${counts.no_name_match}**`,
    "",
    "IDs systems mein alag hain; comparison product names par hai. Possible matches ko website par maujood product tasleem nahin kiya gaya. Packing aur dusri internal categories bhi full report mein shamil hain; unhein publish karne ka faisla alag se karna hoga.",
    "",
    "| POS category | POS total | Name matched | Review | No match |",
    "| --- | ---: | ---: | ---: | ---: |",
    ...categoryLines,
    "",
    "`not-confidently-matched.csv` mein review aur no-match rows hain. `all-active-sellable-products.csv` mein har POS product ka status hai.",
    "",
  ].join("\n");
  fs.writeFileSync(path.join(reportDir, "summary.md"), markdown, "utf8");
  console.log(JSON.stringify({ posProducts: posProducts.length, websiteProducts: websiteProducts.length, counts, matchedButHidden, missing: missing.length, reportDir }));
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
