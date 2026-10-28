import { env } from "cloudflare:workers";
import { hashPassword } from "better-auth/crypto";
import { z } from "zod";
import {
  checkOrigin,
  throttle,
  digest,
  randomCode,
} from "../../../lib/member-auth";
import { guard, json, body } from "../../../lib/server";
export async function POST(r: Request) {
  return guard(async () => {
    checkOrigin(r);
    const x = z
      .object({
        username: z
          .string()
          .trim()
          .toLowerCase()
          .regex(/^[a-z0-9_]{3,24}$/),
        recoveryCode: z.string().min(20).max(100),
        password: z.string().min(12).max(128),
      })
      .parse(await body(r));
    await throttle(r, "recover", x.username, 5, 1800000);
    const db = env.DB!,
      hash = await digest(x.recoveryCode.trim()),
      next = randomCode(),
      nextHash = await digest(next);
    const p = await db
      .prepare(
        "SELECT p.user_id FROM member_profile p JOIN member_user u ON u.id=p.user_id WHERE u.username=? AND p.recovery_hash=?",
      )
      .bind(x.username, hash)
      .first<{ user_id: string }>();
    if (!p) return json({ error: "用户名或恢复码不正确。" }, 400);
    const passwordHash = await hashPassword(x.password);
    // Every statement checks the old hash. Competing recovery attempts cannot both consume a code.
    const results = await db.batch([
      db
        .prepare(
          "UPDATE member_account SET password=?,updated_at=? WHERE user_id=? AND provider_id='credential' AND EXISTS(SELECT 1 FROM member_profile WHERE user_id=? AND recovery_hash=?)",
        )
        .bind(passwordHash, Date.now(), p.user_id, p.user_id, hash),
      db
        .prepare(
          "DELETE FROM member_session WHERE user_id=? AND EXISTS(SELECT 1 FROM member_profile WHERE user_id=? AND recovery_hash=?)",
        )
        .bind(p.user_id, p.user_id, hash),
      db
        .prepare(
          "UPDATE member_profile SET recovery_hash=? WHERE user_id=? AND recovery_hash=?",
        )
        .bind(nextHash, p.user_id, hash),
    ]);
    if (!results[2].meta.changes)
      return json({ error: "恢复码已使用，请使用最新恢复码。" }, 400);
    return json({ ok: true, recoveryCode: next });
  });
}
