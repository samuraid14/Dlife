import { z } from "zod";
import {
  identity,
  database,
  bucket,
  guard,
  json,
  body,
  dateSchema,
  mediaSchema,
} from "../../lib/server";
const schema = z
  .object({
    id: z.string().uuid().optional(),
    day: dateSchema,
    title: z.string().max(120).default(""),
    body: z.string().max(12000).default(""),
    media: z.array(mediaSchema).max(6).default([]),
    mood: z.number().int().min(1).max(5).nullable().optional(),
  })
  .refine(
    (x) => x.body.trim() || x.title.trim() || x.media.length,
    "写点文字，或添加一张照片吧",
  );
export async function GET(r: Request) {
  return guard(async () => {
    const u = await identity(r);
    const x = await database()
      .prepare(
        "SELECT * FROM entries WHERE user_id=? AND deleted_at IS NULL ORDER BY day DESC, created_at DESC",
      )
      .bind(u)
      .all();
    return json({
      entries: x.results.map((e: any) => ({
        ...e,
        media: JSON.parse(e.media),
      })),
    });
  });
}
export async function POST(r: Request) {
  return guard(async () => {
    const u = await identity(r),
      x = schema.parse(await body(r)),
      db = database(),
      id = x.id || crypto.randomUUID(),
      now = new Date().toISOString();
    if (
      x.id &&
      !(await db
        .prepare("SELECT id FROM entries WHERE id=? AND user_id=?")
        .bind(id, u)
        .first())
    )
      return json({ error: "记录不存在" }, 404);
    for (const m of x.media) {
      const o = await bucket().head(m.key);
      if (!o || o.customMetadata?.userId !== u)
        return json({ error: "附件不存在或不属于当前用户" }, 400);
    }
    const q = x.id
      ? db
          .prepare(
            "UPDATE entries SET day=?,title=?,body=?,media=?,updated_at=?,deleted_at=NULL WHERE id=? AND user_id=?",
          )
          .bind(x.day, x.title, x.body, JSON.stringify(x.media), now, id, u)
      : db
          .prepare(
            "INSERT INTO entries(id,user_id,day,title,body,media,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)",
          )
          .bind(
            id,
            u,
            x.day,
            x.title,
            x.body,
            JSON.stringify(x.media),
            now,
            now,
          );
    const ops = [q];
    if (x.mood)
      ops.push(
        db
          .prepare(
            "INSERT INTO moods(id,user_id,day,score) VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET score=excluded.score",
          )
          .bind(u + ":" + x.day, u, x.day, x.mood),
      );
    await db.batch(ops);
    return json({ id });
  });
}
export async function DELETE(r: Request) {
  return guard(async () => {
    const u = await identity(r),
      { id } = z.object({ id: z.string().uuid() }).parse(await body(r));
    await database()
      .prepare(
        "UPDATE entries SET deleted_at=?,updated_at=? WHERE id=? AND user_id=? AND deleted_at IS NULL",
      )
      .bind(new Date().toISOString(), new Date().toISOString(), id, u)
      .run();
    return json({ ok: true });
  });
}
export async function PATCH(r: Request) {
  return guard(async () => {
    const u = await identity(r),
      { id } = z.object({ id: z.string().uuid() }).parse(await body(r));
    await database()
      .prepare("UPDATE entries SET deleted_at=NULL WHERE id=? AND user_id=?")
      .bind(id, u)
      .run();
    return json({ ok: true });
  });
}
