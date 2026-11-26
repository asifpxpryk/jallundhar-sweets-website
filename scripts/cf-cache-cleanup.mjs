// Deletes page-cache copies left in R2 by earlier deploys. Each deploy writes its pages under
// incremental-cache/<BUILD_ID>/ and nothing removes the old folders, so the bucket keeps growing.
// Keeps the build the live site is running (read from https://www.jallundharmain.com/BUILD_ID).
//
//   node scripts/cf-cache-cleanup.mjs           list what would be deleted
//   node scripts/cf-cache-cleanup.mjs --delete  delete it
//
// Uses a temporary worker (scripts/cf-cache-cleanup-worker.js) with the bucket bound to it,
// because wrangler has no "delete folder" command. The worker is removed at the end.
import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const repo = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, "$1")), "..");
const doDelete = process.argv.includes("--delete");
const NAME = "jallundhar-cache-cleaner";
const BUCKET = "jallundhar-next-cache";

const live = (await (await fetch("https://www.jallundharmain.com/BUILD_ID", { cache: "no-store" })).text()).trim();
if (!/^[\w-]{10,}$/.test(live)) throw new Error(`Could not read the live build ID (got "${live.slice(0, 40)}")`);
console.log(`Live build: ${live}`);

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cache-cleaner-"));
fs.copyFileSync(path.join(repo, "scripts/cf-cache-cleanup-worker.js"), path.join(dir, "worker.js"));
fs.writeFileSync(
  path.join(dir, "wrangler.jsonc"),
  JSON.stringify({
    name: NAME,
    main: "worker.js",
    compatibility_date: "2026-11-01",
    workers_dev: true,
    r2_buckets: [{ binding: "B", bucket_name: BUCKET }],
  })
);
const token = crypto.randomBytes(32).toString("hex");
const wrangler = (args, input) =>
  execFileSync(process.platform === "win32" ? "npx.cmd" : "npx", ["--prefix", repo, "wrangler", ...args], {
    cwd: dir,
    input,
    encoding: "utf8",
    shell: process.platform === "win32",
    stdio: ["pipe", "pipe", "pipe"],
  });

let deployed = false;
try {
  const out = wrangler(["deploy"]);
  deployed = true;
  const url = out.match(/https:\/\/\S+\.workers\.dev/)?.[0];
  if (!url) throw new Error("Could not find the temporary worker's address in the wrangler output");
  wrangler(["secret", "put", "TOKEN"], token);

  const call = async (p, init = {}) => {
    for (let attempt = 1; ; attempt++) {
      try {
        const res = await fetch(url + p, { ...init, headers: { "x-token": token } });
        if (res.ok) return res.json();
        if (attempt >= 8) throw new Error(`${p} answered ${res.status}`);
      } catch (error) {
        if (attempt >= 8) throw error;
      }
      // The secret takes a few seconds to reach the worker after it is set.
      await new Promise((r) => setTimeout(r, 2000 * attempt));
    }
  };

  const builds = await call("/builds");
  const keep = `incremental-cache/${live}/`;
  if (!builds.includes(keep)) throw new Error(`The live build's folder ${keep} is not in the bucket, so nothing was deleted`);
  const old = builds.filter((b) => b !== keep);
  console.log(`Build folders: ${builds.length}, keeping 1, old: ${old.length}`);
  for (const b of old) console.log(`  ${doDelete ? "deleting" : "would delete"} ${b}`);

  if (doDelete) {
    let total = 0;
    for (const prefix of old) {
      for (;;) {
        const r = await call(`/delete?prefix=${encodeURIComponent(prefix)}`, { method: "POST" });
        total += r.deleted;
        process.stdout.write(`\r  ${prefix} ... ${total} files deleted so far`);
        if (r.done) break;
      }
      console.log();
    }
    console.log(`DONE: ${total} old files deleted`);
  } else if (old.length) {
    console.log("Nothing deleted. Run again with --delete to delete these.");
  }
} finally {
  if (deployed) {
    try {
      wrangler(["delete", "--name", NAME, "--force"]);
      console.log("Temporary worker removed.");
    } catch {
      console.log(`Could not remove the temporary worker; run: npx wrangler delete --name ${NAME} --force`);
    }
  }
  fs.rmSync(dir, { recursive: true, force: true });
}
