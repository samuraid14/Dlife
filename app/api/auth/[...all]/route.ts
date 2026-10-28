import { memberAuth, checkOrigin, throttle } from "../../../lib/member-auth";
import { guard, json } from "../../../lib/server";
export async function GET(r: Request) {
  return guard(async () => {
    if (new URL(r.url).pathname !== "/api/auth/get-session")
      return json({ error: "此操作不可用" }, 404);
    return memberAuth().handler(r);
  });
}
export async function POST(r: Request) {
  return guard(async () => {
    checkOrigin(r);
    const path = new URL(r.url).pathname;
    if (!["/api/auth/sign-in/username", "/api/auth/sign-out"].includes(path))
      return json({ error: "此操作不可用" }, 404);
    if (path.endsWith("/username")) {
      const s = await r.clone().text();
      if (s.length > 3000) return json({ error: "输入过长" }, 413);
      let x: any;
      try {
        x = JSON.parse(s);
      } catch {
        return json({ error: "输入无效" }, 400);
      }
      await throttle(r, "login", String(x.username || "").slice(0, 24), 10);
    }
    const response = await memberAuth().handler(r);
    if (!response.ok && path.endsWith("/username") && response.status !== 429)
      return json({ error: "用户名或密码不正确。" }, 401);
    return response;
  });
}
