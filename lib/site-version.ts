import { readFileSync } from "fs";
import { join } from "path";

function packageVersion(): string {
  try {
    const raw = readFileSync(join(process.cwd(), "package.json"), "utf8");
    const pkg = JSON.parse(raw) as { version?: string };
    return pkg.version?.trim() || "0.0.0";
  } catch {
    return "0.0.0";
  }
}

/** Ops / admin only — never put this in public chrome. */
export function getSiteVersion(): string {
  const fromEnv = process.env.SITE_VERSION?.trim();
  if (fromEnv) return fromEnv;

  const sha = process.env.VERCEL_GIT_COMMIT_SHA?.trim();
  const pkg = packageVersion();
  if (sha) return `${pkg}+${sha.slice(0, 7)}`;
  return pkg;
}

export function getSiteVersionPayload() {
  return {
    version: getSiteVersion(),
    packageVersion: packageVersion(),
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
    env: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? null,
  };
}
