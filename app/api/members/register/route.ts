import { env } from "cloudflare:workers";
import { z } from "zod";
import { getChatGPTUser } from "../../../chatgpt-auth";
import {
  memberAuth,
  checkOrigin,
  throttle,
  digest,
  randomCode,
  canSetupOwner,
} from "../../../lib/member-auth";
import { guard, json, body } from "../../../lib/server";
const input = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_]{3,24}$/, "用户名为 3–24 位字母、数字或下划线"),
  password: z.string().min(12, "密码至少需要 12 个字符").max(128),
  inviteCode: z.string().max(100).default(""),
  setup: z.boolean().default(false),
});
export async function POST(r: Request) {
  return guard(async () => {
    checkOrigin(r);
    const x = input.parse(await body(r));
    await throttle(r, "register", "", 10);
    const db = env.DB!,
      nonce = "pending:" + crypto.randomUUID();
    let inviteId: string,
      legacyId: string | null = null;
    if (x.setup) {
      if (!(await canSetupOwner()))
        return json({ error: "站长初始化不可用。" }, 403);
      legacyId = (await getChatGPTUser())!.userId;
      inviteId = "owner-setup";
      const lease = await db
        .prepare(
          "INSERT INTO member_invite(id,code_hash,label,expires_at,created_at,used_by) VALUES('owner-setup','owner-setup','站长初始化',?,?,?) ON CONFLICT(id) DO NOTHING RETURNING id",
        )
        .bind(Date.now() + 3600000, new Date().toISOString(), nonce)
        .first();
      if (!lease)
        return json({ error: "站长账号正在初始化，请稍后再试。" }, 409);
    } else {
      const hash = await digest(x.inviteCode.trim());
      const invite = await db
        .prepare(
          "UPDATE member_invite SET used_by=? WHERE code_hash=? AND used_by IS NULL AND revoked=0 AND expires_at>? RETURNING id",
        )
        .bind(nonce, hash, Date.now())
        .first<{ id: string }>();
      if (!invite) return json({ error: "邀请码无效、已使用或已过期。" }, 400);
      inviteId = invite.id;
    }
    let authId: string | null = null;
    try {
      // This internal non-deliverable address is only a library identifier. No email is collected or sent.
      const response = await memberAuth().api.signUpEmail({
        headers: r.headers,
        body: {
          username: x.username,
          name: x.username,
          password: x.password,
          email: crypto.randomUUID() + "@accounts.invalid",
        },
        asResponse: true,
      });
      const data = (await response.clone().json()) as any;
      if (!response.ok) {
        if (x.setup)
          await db
            .prepare("DELETE FROM member_invite WHERE id=? AND used_by=?")
            .bind(inviteId, nonce)
            .run();
        else
          await db
            .prepare(
              "UPDATE member_invite SET used_by=NULL WHERE id=? AND used_by=?",
            )
            .bind(inviteId, nonce)
            .run();
        return json({ error: "用户名已被使用，或注册信息不符合要求。" }, 400);
      }
      authId = data.user?.id;
      if (!authId) throw new Error("Missing user");
      const recoveryCode = randomCode();
      await db.batch([
        db
          .prepare(
            "INSERT INTO member_profile(user_id,storage_id,role,recovery_hash,created_at) VALUES(?,?,?,?,?)",
          )
          .bind(
            authId,
            legacyId || "member:" + authId,
            x.setup ? "owner" : "member",
            await digest(recoveryCode),
            new Date().toISOString(),
          ),
        db
          .prepare(
            "UPDATE member_invite SET used_by=? WHERE id=? AND used_by=?",
          )
          .bind(authId, inviteId, nonce),
      ]);
      const h = new Headers(response.headers);
      h.set("Content-Type", "application/json");
      h.set("Cache-Control", "no-store");
      return new Response(JSON.stringify({ ok: true, recoveryCode }), {
        status: 200,
        headers: h,
      });
    } catch (e) {
      if (authId)
        await db
          .prepare("DELETE FROM member_user WHERE id=?")
          .bind(authId)
          .run();
      if (x.setup)
        await db
          .prepare("DELETE FROM member_invite WHERE id=? AND used_by=?")
          .bind(inviteId, nonce)
          .run();
      else
        await db
          .prepare(
            "UPDATE member_invite SET used_by=NULL WHERE id=? AND used_by=?",
          )
          .bind(inviteId, nonce)
          .run();
      throw e;
    }
  });
}
