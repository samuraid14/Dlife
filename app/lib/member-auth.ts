import { env } from "cloudflare:workers";
import { headers } from "next/headers";
import { betterAuth } from "better-auth";
import { username } from "better-auth/plugins";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { getDb } from "../../db";
import * as schema from "../../db/schema";
import { getChatGPTUser } from "../chatgpt-auth";
export type AppUser = {
  userId: string;
  authId: string | null;
  username: string;
  role: "owner" | "member";
  mode: "member" | "chatgpt";
};
export function memberAuth() {
  const secret = env.DLIFE_AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error("独立账号服务尚未配置");
  return betterAuth({
    appName: "Dlife",
    baseURL: env.DLIFE_AUTH_URL || "http://127.0.0.1:5173",
    secret,
    database: drizzleAdapter(getDb(), {
      provider: "sqlite",
      schema: {
        user: schema.user,
        session: schema.session,
        account: schema.account,
        verification: schema.verification,
      },
      transaction: false,
    }),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
      minPasswordLength: 12,
      maxPasswordLength: 128,
    },
    plugins: [
      username({
        minUsernameLength: 3,
        maxUsernameLength: 24,
        usernameValidator: (value) => /^[a-zA-Z0-9_]+$/.test(value),
      }),
    ],
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
      cookieCache: { enabled: false },
    },
    rateLimit: { enabled: false }, // All exposed mutation routes use D1-backed limits below.
    advanced: {
      cookiePrefix: "dlife",
      ipAddress: { ipAddressHeaders: ["cf-connecting-ip"] },
      defaultCookieAttributes: {
        httpOnly: true,
        sameSite: "lax",
        secure: (env.DLIFE_AUTH_URL || "").startsWith("https:"),
      },
    },
  });
}
export async function currentAppUser(): Promise<AppUser | null> {
  if (env.DLIFE_AUTH_SECRET) {
    const s = await memberAuth().api.getSession({ headers: await headers() });
    if (s) {
      const p = await env
        .DB!.prepare(
          "SELECT storage_id,role FROM member_profile WHERE user_id=?",
        )
        .bind(s.user.id)
        .first<{ storage_id: string; role: "owner" | "member" }>();
      if (p)
        return {
          userId: p.storage_id,
          authId: s.user.id,
          username: s.user.name,
          role: p.role,
          mode: "member",
        };
    }
  }
  const platform = await getChatGPTUser();
  if (!platform) return null;
  const owner = await env
    .DB!.prepare(
      "SELECT user_id,storage_id FROM member_profile WHERE role='owner' LIMIT 1",
    )
    .first<{ user_id: string; storage_id: string }>();
  if (owner?.storage_id === platform.userId)
    return {
      userId: platform.userId,
      authId: owner.user_id,
      username: platform.displayName,
      role: "owner",
      mode: "chatgpt",
    };
  // Enable this bootstrap only while the host's audience is owner-private.
  if (!owner && env.DLIFE_OWNER_SETUP === "enabled")
    return {
      userId: platform.userId,
      authId: null,
      username: platform.displayName,
      role: "owner",
      mode: "chatgpt",
    };
  return null;
}
export async function canSetupOwner() {
  if (env.DLIFE_OWNER_SETUP !== "enabled") return false;
  const p = await getChatGPTUser();
  if (!p) return false;
  return !(await env
    .DB!.prepare(
      "SELECT user_id FROM member_profile WHERE role='owner' LIMIT 1",
    )
    .first());
}
export function checkOrigin(r: Request) {
  if (r.method === "GET" || r.method === "HEAD") return;
  const origin = r.headers.get("origin");
  if (origin !== new URL(r.url).origin)
    throw Response.json({ error: "请从本站页面提交操作。" }, { status: 403 });
}
export async function digest(value: string) {
  const b = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(b), (x) =>
    x.toString(16).padStart(2, "0"),
  ).join("");
}
export function randomCode() {
  return Array.from(crypto.getRandomValues(new Uint8Array(24)), (x) =>
    x.toString(16).padStart(2, "0"),
  ).join("");
}
export async function throttle(
  r: Request,
  action: string,
  handle = "",
  max = 12,
  windowMs = 600000,
) {
  const ip = r.headers.get("cf-connecting-ip") || "local";
  for (const bucket of [
    action + ":ip:" + ip,
    ...(handle ? [action + ":user:" + handle.toLowerCase()] : []),
  ]) {
    const now = Date.now(),
      id = await digest(bucket);
    const row = await env
      .DB!.prepare(
        "INSERT INTO member_attempt(id,hits,reset_at) VALUES(?,1,?) ON CONFLICT(id) DO UPDATE SET hits=CASE WHEN reset_at<=? THEN 1 ELSE hits+1 END,reset_at=CASE WHEN reset_at<=? THEN ? ELSE reset_at END RETURNING hits",
      )
      .bind(id, now + windowMs, now, now, now + windowMs)
      .first<{ hits: number }>();
    if (!row || row.hits > max)
      throw Response.json(
        { error: "尝试次数较多，请稍后再试。" },
        { status: 429 },
      );
  }
}
