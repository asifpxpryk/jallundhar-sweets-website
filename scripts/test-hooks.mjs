/**
 * Lets `node --test` run the repo's TypeScript as the app sees it: "@/x" and extensionless
 * imports resolve to .ts/.tsx/.json files, and JSON imports need no import attribute.
 */
import { registerHooks } from "node:module";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SUFFIXES = ["", ".ts", ".tsx", ".js", ".mjs", ".json", "/index.ts"];

function findFile(base) {
  for (const suffix of SUFFIXES) {
    const candidate = base + suffix;
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return null;
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    let base = null;
    if (specifier.startsWith("@/")) base = path.join(root, specifier.slice(2));
    else if (/^\.\.?\//.test(specifier) && context.parentURL?.startsWith("file:")) {
      base = path.resolve(path.dirname(fileURLToPath(context.parentURL)), specifier);
    }
    const file = base ? findFile(base) : null;
    if (file) {
      const format = file.endsWith(".ts") ? "module-typescript" : undefined;
      return { url: pathToFileURL(file).href, format, shortCircuit: true };
    }
    try {
      return nextResolve(specifier, context);
    } catch (error) {
      // Packages without an exports map, such as "next/cache", need the file extension in ESM.
      if (error?.code !== "ERR_MODULE_NOT_FOUND" || !/^[@a-z][^:]*\/[^.]+$/i.test(specifier)) throw error;
      return nextResolve(`${specifier}.js`, context);
    }
  },
  load(url, context, nextLoad) {
    if (url.startsWith("file:") && url.endsWith(".json")) {
      const json = readFileSync(fileURLToPath(url), "utf8");
      return { format: "module", source: `export default ${json};`, shortCircuit: true };
    }
    return nextLoad(url, context);
  },
});
