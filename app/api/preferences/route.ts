import { z } from "zod";
import { identity, database, guard, json, body } from "../../lib/server";
const color = z.string().regex(/^#[0-9a-fA-F]{6}$/);
const schema = z.object({
  displayName: z.string().max(30).default(""),
  subtitle: z.string().max(100).default("把日子过成自己的样子。"),
  background: color.default("#eee5d5"),
  accent: color.default("#84604b"),
  font: z.enum(["sans", "serif"]).default("serif"),
  layout: z.enum(["comfortable", "compact"]).default("comfortable"),
  appearanceVersion: z.number().int().min(1).max(2).default(1),
});
export async function GET(r: Request) {
  return guard(async () => {
    const u = await identity(r),
      v = await database()
        .prepare("SELECT payload FROM preferences WHERE user_id=?")
        .bind(u)
        .first<{ payload: string }>();
    return json({ preferences: v ? JSON.parse(v.payload) : null });
  });
}
export async function POST(r: Request) {
  return guard(async () => {
    const u = await identity(r),
      p = schema.parse(await body(r));
    await database()
      .prepare(
        "INSERT INTO preferences(user_id,payload) VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET payload=excluded.payload",
      )
      .bind(u, JSON.stringify(p))
      .run();
    return json({ ok: true });
  });
}
