import { z } from "zod";
import { identity, database, guard, json, body } from "../../lib/server";
const color = z.string().regex(/^#[0-9a-fA-F]{6}$/);
const schema = z.object({
  displayName: z.string().max(30).default(""),
  subtitle: z.string().max(100).default("把日子过成自己的样子。"),
  background: color.default("#101110"),
  accent: color.default("#c6d5a4"),
  font: z.enum(["sans", "serif"]).default("sans"),
  layout: z.enum(["comfortable", "compact"]).default("comfortable"),
  pet: z.object({
    name: z.string().min(1).max(20),
    kind: z.enum(["spirit", "cat", "bunny"]),
    color: color,
    seed: z.number().int().min(0).max(999999),
    personality: z.enum(["温柔倾听", "活泼元气", "安静陪伴"]),
  }),
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
