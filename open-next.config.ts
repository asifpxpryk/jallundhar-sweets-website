import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import d1NextTagCache from "@opennextjs/cloudflare/overrides/tag-cache/d1-next-tag-cache";
import doQueue from "@opennextjs/cloudflare/overrides/queue/do-queue";

/**
 * Cloudflare Workers build (OpenNext). Pages and unstable_cache data live in R2, revalidateTag /
 * revalidatePath (POS refresh, admin edits) are recorded in D1, and time-based revalidation runs
 * through a Durable Object queue. Bindings are declared in wrangler.jsonc.
 */
export default defineCloudflareConfig({
  incrementalCache: r2IncrementalCache,
  tagCache: d1NextTagCache,
  queue: doQueue,
  enableCacheInterception: true,
});
