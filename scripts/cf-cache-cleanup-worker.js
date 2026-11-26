// Temporary worker used by scripts/cf-cache-cleanup.mjs: lists the build folders in the page-cache
// bucket and deletes one folder at a time. Deployed for the cleanup and removed right after.
export default {
  async fetch(req, env) {
    if (!env.TOKEN || req.headers.get("x-token") !== env.TOKEN) return new Response("no", { status: 401 });
    const url = new URL(req.url);

    if (url.pathname === "/builds") {
      const builds = [];
      let cursor;
      do {
        const page = await env.B.list({ prefix: "incremental-cache/", delimiter: "/", cursor });
        builds.push(...page.delimitedPrefixes);
        cursor = page.truncated ? page.cursor : undefined;
      } while (cursor);
      return Response.json(builds);
    }

    if (url.pathname === "/delete" && req.method === "POST") {
      const prefix = url.searchParams.get("prefix") || "";
      if (!/^incremental-cache\/[\w-]{10,}\/$/.test(prefix)) return new Response("bad prefix", { status: 400 });
      let deleted = 0;
      // About 80 bucket calls per request, well under the per-request limit.
      for (let round = 0; round < 40; round++) {
        const page = await env.B.list({ prefix, limit: 1000 });
        const keys = page.objects.map((object) => object.key);
        if (!keys.length) return Response.json({ deleted, done: true });
        await env.B.delete(keys);
        deleted += keys.length;
      }
      return Response.json({ deleted, done: false });
    }

    return new Response("not found", { status: 404 });
  },
};
