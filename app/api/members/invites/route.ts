import { env } from "cloudflare:workers";
import { z } from "zod";
import {
  currentAppUser,
  checkOrigin,
  digest,
  randomCode,
} from "../../../lib/member-auth";
import { guard, json, body } from "../../../lib/server";
async function owner() {
  const u = await currentAppUser();
  if (!u?.authId || u.role !== "owner")
    throw json({ error: "仅站长可以管理邀请。" }, 403);
}
export async function GET() {
  return guard(async () => {
    await owner();
    const rows = await env
      .DB!.prepare(
        "SELECT id,label,expires_at,created_at,used_by IS NOT NULL AS used,revoked FROM member_invite WHERE id!='owner-setup' ORDER BY created_at DESC LIMIT 100",
      )
      .all();
    return json({ invites: rows.results });
  });
}
export async function POST(r: Request) {
  return guard(async () => {
    checkOrigin(r);
    await owner();
    const x = z
      .object({ label: z.string().trim().min(1).max(40) })
      .parse(await body(r));
    const code = randomCode(),
      id = crypto.randomUUID(),
      expires = Date.now() + 7 * 86400000;
    await env
      .DB!.prepare(
        "INSERT INTO member_invite(id,code_hash,label,expires_at,created_at) VALUES(?,?,?,?,?)",
      )
      .bind(id, await digest(code), x.label, expires, new Date().toISOString())
      .run();
    return json({ code, id, expiresAt: expires });
  });
}
export async function DELETE(r: Request) {
  return guard(async () => {
    checkOrigin(r);
    await owner();
    const { id } = z.object({ id: z.string().uuid() }).parse(await body(r));
    await env
      .DB!.prepare(
        "UPDATE member_invite SET revoked=1 WHERE id=? AND used_by IS NULL",
      )
      .bind(id)
      .run();
    return json({ ok: true });
  });
}
