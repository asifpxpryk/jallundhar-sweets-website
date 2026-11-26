import fs from "node:fs";
const [listPath, tokenPath, url] = process.argv.slice(2);
const list = JSON.parse(fs.readFileSync(listPath, "utf8"));
const token = fs.readFileSync(tokenPath, "utf8").trim();
const MAX = 8e6; const batches = []; let cur = [], size = 0;
for (const o of list) {
  const z = fs.statSync(o.file).size;
  if (cur.length && (size + z > MAX || cur.length >= 100)) { batches.push(cur); cur = []; size = 0; }
  cur.push(o); size += z;
}
if (cur.length) batches.push(cur);
let done = 0, files = 0, next = 0;
async function send(b) {
  const parts = [];
  for (const o of b) {
    const k = Buffer.from(o.key), d = fs.readFileSync(o.file);
    const h1 = Buffer.alloc(4); h1.writeUInt32BE(k.length); const h2 = Buffer.alloc(4); h2.writeUInt32BE(d.length);
    parts.push(h1, k, h2, d);
  }
  const body = Buffer.concat(parts);
  for (let t = 1; t <= 6; t++) {
    try {
      const r = await fetch(url, { method: "POST", headers: { "x-token": token }, body });
      if (r.ok && Number(await r.text()) === b.length) return;
      console.log("retry", t, r.status);
    } catch (e) { console.log("retry", t, e.message); }
    await new Promise(r => setTimeout(r, 2000 * t));
  }
  throw new Error("batch failed");
}
async function worker() {
  while (next < batches.length) { const b = batches[next++]; await send(b); done++; files += b.length;
    if (done % 20 === 0) console.log(`${files}/${list.length}`); }
}
await Promise.all(Array.from({ length: 6 }, worker));
console.log(`DONE ${files}/${list.length}`);
