import { z } from "zod";
import {
  identity,
  database,
  guard,
  json,
  body,
  dateSchema,
} from "../../lib/server";
export async function GET(r: Request) {
  return guard(async () => {
    const u = await identity(r);
    return json({
      moods: (
        await database()
          .prepare("SELECT day,score FROM moods WHERE user_id=? ORDER BY day")
          .bind(u)
          .all()
      ).results,
    });
  });
}
export async function POST(r: Request) {
  return guard(async () => {
    const u = await identity(r),
      x = z
        .object({ day: dateSchema, score: z.number().int().min(1).max(5) })
        .parse(await body(r));
    await database()
      .prepare(
        "INSERT INTO moods(id,user_id,day,score) VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET score=excluded.score",
      )
      .bind(u + ":" + x.day, u, x.day, x.score)
      .run();
    return json({ ok: true });
  });
}
