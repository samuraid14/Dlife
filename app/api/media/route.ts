import { identity, bucket, guard, json } from "../../lib/server";
const LIMIT = 20 * 1024 * 1024;
function detect(b: Uint8Array) {
  if (b[0] === 255 && b[1] === 216) return "image/jpeg";
  if (b[0] === 137 && b[1] === 80 && b[2] === 78 && b[3] === 71)
    return "image/png";
  const s = new TextDecoder().decode(b.slice(0, 16));
  if (s.startsWith("GIF8")) return "image/gif";
  if (s.startsWith("RIFF") && s.slice(8, 12) === "WEBP") return "image/webp";
  if (s.slice(4, 8) === "ftyp") return "video/mp4";
  if (b[0] === 26 && b[1] === 69 && b[2] === 223 && b[3] === 163)
    return "video/webm";
  return null;
}
export async function POST(r: Request) {
  return guard(async () => {
    const u = await identity(r);
    if (Number(r.headers.get("content-length")) > LIMIT + 65536)
      return json({ error: "每个附件最大 20 MB" }, 413);
    const f = (await r.formData()).get("file");
    if (!(f instanceof File) || !f.size || f.size > LIMIT)
      return json({ error: "请选择不超过 20 MB 的照片或视频" }, 400);
    const mime = detect(new Uint8Array(await f.slice(0, 32).arrayBuffer()));
    if (!mime)
      return json({ error: "支持 JPG、PNG、GIF、WebP、MP4、MOV 和 WebM" }, 400);
    const key = "media/" + crypto.randomUUID();
    await bucket().put(key, f.stream(), {
      httpMetadata: { contentType: mime },
      customMetadata: { userId: u, name: f.name.slice(0, 200) },
    });
    return json({
      key,
      name: f.name.slice(0, 200),
      type: mime.startsWith("image") ? "image" : "video",
    });
  });
}
export async function GET(r: Request) {
  return guard(async () => {
    const u = await identity(r),
      key = new URL(r.url).searchParams.get("key");
    if (!key || !/^media\/[0-9a-f-]{36}$/.test(key))
      return json({ error: "附件不存在" }, 404);
    const head = await bucket().head(key);
    if (!head || head.customMetadata?.userId !== u)
      return json({ error: "附件不存在" }, 404);
    const range = r.headers.get("range");
    let options: { range?: { offset: number; length: number } } = {};
    if (range) {
      const m = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (!m || (!m[1] && !m[2]))
        return new Response(null, {
          status: 416,
          headers: { "Content-Range": `bytes */${head.size}` },
        });
      let start = m[1] ? Number(m[1]) : Math.max(0, head.size - Number(m[2]));
      let end =
        m[1] && m[2] ? Math.min(head.size - 1, Number(m[2])) : head.size - 1;
      if (start >= head.size || start > end)
        return new Response(null, {
          status: 416,
          headers: { "Content-Range": `bytes */${head.size}` },
        });
      options = { range: { offset: start, length: end - start + 1 } };
    }
    const o = await bucket().get(key, options);
    if (!o) return json({ error: "附件不存在" }, 404);
    const headers = new Headers({
      "Content-Type":
        head.httpMetadata?.contentType || "application/octet-stream",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Accept-Ranges": "bytes",
    });
    if (options.range) {
      headers.set(
        "Content-Range",
        `bytes ${options.range.offset}-${options.range.offset + options.range.length - 1}/${head.size}`,
      );
      headers.set("Content-Length", String(options.range.length));
    } else headers.set("Content-Length", String(head.size));
    return new Response(o.body, { status: range ? 206 : 200, headers });
  });
}
