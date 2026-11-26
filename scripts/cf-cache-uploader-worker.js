export default {
  async fetch(req, env) {
    if (req.headers.get("x-token") !== env.TOKEN) return new Response("no", { status: 401 });
    if (req.method !== "POST") return new Response("ok");
    // body: repeated [u32 keyLen][key][u32 dataLen][data]
    const buf = new Uint8Array(await req.arrayBuffer());
    const dv = new DataView(buf.buffer);
    let i = 0, n = 0; const puts = [];
    while (i < buf.length) {
      const kl = dv.getUint32(i); i += 4;
      const key = new TextDecoder().decode(buf.subarray(i, i + kl)); i += kl;
      const dl = dv.getUint32(i); i += 4;
      puts.push(env.B.put(key, buf.slice(i, i + dl))); i += dl; n++;
    }
    await Promise.all(puts);
    return new Response(String(n));
  },
};
