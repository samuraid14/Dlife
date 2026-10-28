import { env } from "cloudflare:workers";
import { z } from "zod";
import { identity, database, guard, json, body } from "../../lib/server";
export async function GET(r: Request) {
  return guard(async () => {
    const u = await identity(r);
    const rows = await database()
      .prepare(
        "SELECT id,role,content,created_at FROM messages WHERE user_id=? ORDER BY created_at DESC LIMIT 60",
      )
      .bind(u)
      .all();
    return json({
      messages: rows.results.reverse(),
      configured: !!(env as any).OPENAI_API_KEY,
    });
  });
}
export async function POST(r: Request) {
  return guard(async () => {
    const u = await identity(r),
      { message } = z
        .object({ message: z.string().trim().min(1).max(1500) })
        .parse(await body(r));
    const key = (env as any).OPENAI_API_KEY;
    if (!key)
      return json({ error: "小精灵的聊天服务尚未配置，请稍后再试。" }, 503);
    const db = database(),
      usageId = u + ":" + new Date().toISOString().slice(0, 10);
    const allowance = await db
      .prepare(
        "INSERT INTO chat_usage(id,count) VALUES(?,1) ON CONFLICT(id) DO UPDATE SET count=count+1 WHERE count<50 RETURNING count",
      )
      .bind(usageId)
      .first();
    if (!allowance)
      return json({ error: "今天已经聊了 50 次，明天再来找小精灵吧。" }, 429);
    const prefs = await db
        .prepare("SELECT payload FROM preferences WHERE user_id=?")
        .bind(u)
        .first<{ payload: string }>(),
      pet = prefs ? JSON.parse(prefs.payload).pet : null;
    const history = (
      await db
        .prepare(
          "SELECT role,content FROM messages WHERE user_id=? ORDER BY created_at DESC LIMIT 12",
        )
        .bind(u)
        .all<{ role: string; content: string }>()
    ).results.reverse();
    try {
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + key,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: (env as any).OPENAI_MODEL || "gpt-6-luna",
          store: false,
          max_output_tokens: 700,
          instructions: `你是生活日记网站 Dlife 中的小精灵，名字是${pet?.name || "小光"}，性格是${pet?.personality || "温柔倾听"}。你是 AI 陪伴角色。用用户所用的语言自然聊天，默认简体中文；回应简短、温柔、具体，先听懂再回应，不说教。不要自称真人、专业治疗师或声称有真人情感。不要暗示用户只需要你或回避现实关系。你不能看到日记、照片、视频和心情记录，不能编造知道这些内容。若用户处于危机或明确自伤风险，表达关心并鼓励联系可信任的人或当地紧急服务，不编造热线。`,
          input: [...history, { role: "user", content: message }],
        }),
        signal: AbortSignal.timeout(45000),
      });
      if (!response.ok) {
        await db
          .prepare("UPDATE chat_usage SET count=MAX(0,count-1) WHERE id=?")
          .bind(usageId)
          .run();
        const err = (await response.json().catch(() => ({}))) as any;
        const code = err?.error?.code;
        if (code === "insufficient_quota")
          return json(
            {
              error:
                "AI 服务余额不足，需要站点管理员在 OpenAI API 平台检查账单。你的记录功能仍可使用。",
            },
            503,
          );
        if (response.status === 401)
          return json(
            { error: "AI 服务的密钥验证失败，请联系站点管理员。" },
            503,
          );
        return json({ error: "小精灵暂时没有连上聊天服务，请稍后再试。" }, 503);
      }
      const result = (await response.json()) as any;
      const answer = (result.output || [])
        .flatMap((item: any) => item.content || [])
        .filter((item: any) => item.type === "output_text")
        .map((item: any) => item.text)
        .join("")
        .trim();
      if (!answer)
        return json({ error: "暂时没有收到回复，请再试一次。" }, 503);
      const now = new Date().toISOString(),
        id = crypto.randomUUID();
      await db.batch([
        db
          .prepare(
            "INSERT INTO messages(id,user_id,role,content,created_at) VALUES(?,?,?,?,?)",
          )
          .bind(crypto.randomUUID(), u, "user", message, now),
        db
          .prepare(
            "INSERT INTO messages(id,user_id,role,content,created_at) VALUES(?,?,?,?,?)",
          )
          .bind(
            id,
            u,
            "assistant",
            answer,
            new Date(Date.now() + 1).toISOString(),
          ),
      ]);
      return json({ message: { id, role: "assistant", content: answer } });
    } catch {
      await db
        .prepare("UPDATE chat_usage SET count=MAX(0,count-1) WHERE id=?")
        .bind(usageId)
        .run();
      return json({ error: "连接超时了，稍后再和小精灵聊聊吧。" }, 503);
    }
  });
}
