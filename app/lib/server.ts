import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../chatgpt-auth";
import { z } from "zod";
export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((s) => {
    const d = new Date(s + "T12:00:00Z");
    return !Number.isNaN(d.valueOf()) && d.toISOString().slice(0, 10) === s;
  }, "日期无效");
export const mediaSchema = z.object({
  key: z.string().max(300),
  name: z.string().max(200),
  type: z.enum(["image", "video"]),
});
export function database() {
  if (!env.DB) throw new Error("数据库尚未连接");
  return env.DB;
}
export function bucket() {
  if (!env.BUCKET) throw new Error("文件存储尚未连接");
  return env.BUCKET;
}
export async function identity(request: Request) {
  const user = await getChatGPTUser();
  if (!user)
    throw new Response(
      JSON.stringify({ error: "请先登录，再保存你的生活记录。" }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  if (!["GET", "HEAD"].includes(request.method)) {
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin)
      throw new Response("Forbidden", { status: 403 });
  }
  return user.userId;
}
export function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}
export async function guard(work: () => Promise<Response>) {
  try {
    return await work();
  } catch (e) {
    if (e instanceof Response) return e;
    if (e instanceof z.ZodError)
      return json({ error: e.issues[0]?.message || "请检查输入" }, 400);
    console.error("Request failed", e instanceof Error ? e.name : "Error");
    return json({ error: "暂时没有保存成功，请稍后重试。" }, 500);
  }
}
export async function body(request: Request) {
  const s = await request.text();
  if (s.length > 50000) throw new Response("Too large", { status: 413 });
  try {
    return JSON.parse(s);
  } catch {
    throw new Response("Invalid JSON", { status: 400 });
  }
}
