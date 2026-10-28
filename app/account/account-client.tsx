"use client";
import { useEffect, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Copy,
  Download,
  Check,
  Plus,
  LoaderCircle,
} from "lucide-react";
type Status = {
  user: {
    username: string;
    role: string;
    mode: string;
    hasAccount: boolean;
  } | null;
  canSetupOwner: boolean;
};
type Invite = {
  id: string;
  label: string;
  expires_at: number;
  used: number;
  revoked: number;
};
async function request(path: string, method = "GET", data?: unknown) {
  const r = await fetch(path, {
    method,
    headers: data ? { "Content-Type": "application/json" } : undefined,
    body: data ? JSON.stringify(data) : undefined,
  });
  const x: any = await r.json().catch(() => ({}));
  if (!r.ok)
    throw new Error(
      x.error?.message || x.error || x.message || "暂时没有成功，请稍后再试。",
    );
  return x;
}
export default function Account() {
  const [status, setStatus] = useState<Status | null>(null),
    [mode, setMode] = useState("login"),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [username, setUsername] = useState(""),
    [password, setPassword] = useState(""),
    [confirm, setConfirm] = useState(""),
    [invite, setInvite] = useState(""),
    [recovery, setRecovery] = useState(""),
    [newRecovery, setNewRecovery] = useState(""),
    [setup, setSetup] = useState(false),
    [invites, setInvites] = useState<Invite[]>([]),
    [label, setLabel] = useState(""),
    [newInvite, setNewInvite] = useState(""),
    [copied, setCopied] = useState(false);
  async function refresh() {
    const x = await request("/api/members/status");
    setStatus(x);
    if (x.user?.role === "owner" && x.user.hasAccount)
      setInvites((await request("/api/members/invites")).invites);
  }
  useEffect(() => {
    if (new URLSearchParams(location.search).has("logout")) {
      request("/api/auth/sign-out", "POST", {})
        .then(() => {
          location.href = "/signout-with-chatgpt?return_to=%2Faccount";
        })
        .catch((e) => {
          setError(e.message);
          setLoading(false);
        });
      return;
    }
    refresh()
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (mode !== "login" && password !== confirm) {
      setError("两次输入的密码不一致。");
      return;
    }
    setBusy(true);
    try {
      if (mode === "login") {
        await request("/api/auth/sign-in/username", "POST", {
          username: username.trim().toLowerCase(),
          password,
        });
        location.href = "/";
      } else if (mode === "register") {
        const x = await request("/api/members/register", "POST", {
          username,
          password,
          inviteCode: invite,
          setup,
        });
        setPassword("");
        setConfirm("");
        setNewRecovery(x.recoveryCode);
        await refresh();
      } else {
        const x = await request("/api/members/recover", "POST", {
          username,
          password,
          recoveryCode: recovery,
        });
        setPassword("");
        setConfirm("");
        setRecovery("");
        setNewRecovery(x.recoveryCode);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function createInvite(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const x = await request("/api/members/invites", "POST", {
        label: label.trim() || "朋友试用",
      });
      setNewInvite(x.code);
      setLabel("");
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function revoke(id: string) {
    try {
      await request("/api/members/invites", "DELETE", { id });
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    }
  }
  function changeMode(value: string, owner = false) {
    setMode(value);
    setSetup(owner);
    setError("");
    setPassword("");
    setConfirm("");
  }
  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("复制不可用，请选中文字后手动复制。");
    }
  }
  function downloadRecovery() {
    const a = document.createElement("a"),
      blob = new Blob(
        [
          `Dlife 账号恢复码\n用户名：${username}\n恢复码：${newRecovery}\n\n请私下保存。每次找回密码后会生成新的恢复码，旧码失效。\n`,
        ],
        { type: "text/plain;charset=utf-8" },
      );
    a.href = URL.createObjectURL(blob);
    a.download = "Dlife-recovery-code.txt";
    a.click();
    URL.revokeObjectURL(a.href);
  }
  return (
    <main className="account-shell">
      <header className="account-top">
        <a href="/" className="account-brand">
          Dlife · 拾光
        </a>
        <a href="/install" className="text-button">
          安装桌面版
          <ArrowUpRight size={14} />
        </a>
      </header>
      <section className="account-card">
        <a className="account-back" href="/">
          <ArrowLeft size={14} />
          回到生活空间
        </a>
        {loading ? (
          <p>
            <LoaderCircle className="spin" size={17} /> 正在打开账号…
          </p>
        ) : newRecovery ? (
          <>
            <div className="eyebrow">KEEP YOUR WAY HOME</div>
            <h1>把恢复码，好好收起来。</h1>
            <p>
              它用于忘记密码时找回账号。请保存到只有你能访问的地方；页面关闭后不会再次显示。
            </p>
            <code className="secret-code">{newRecovery}</code>
            <div className="account-action-row">
              <button className="secondary" onClick={() => copy(newRecovery)}>
                {copied ? <Check size={14} /> : <Copy size={14} />}复制恢复码
              </button>
              <button className="secondary" onClick={downloadRecovery}>
                <Download size={14} />
                下载到本机
              </button>
            </div>
            <button
              className="primary account-wide"
              onClick={() => {
                setNewRecovery("");
                if (mode === "recover") {
                  changeMode("login");
                } else location.href = "/account";
              }}
            >
              我已保存，继续
            </button>
          </>
        ) : (
          <>
            <div className="eyebrow">YOUR OWN LITTLE UNIVERSE</div>
            <h1>
              {status?.user?.hasAccount
                ? "我的账号"
                : setup
                  ? "建立你的站长账号"
                  : mode === "register"
                    ? "收到邀请，开始记录。"
                    : mode === "recover"
                      ? "找回我的空间。"
                      : "欢迎回到自己的生活。"}
            </h1>
            {status?.user?.hasAccount && mode !== "recover" ? (
              <>
                <p>
                  当前账号 <strong>{status.user.username}</strong> ·{" "}
                  {status.user.role === "owner" ? "站长" : "朋友试用"}
                </p>
                <div className="account-action-row">
                  <a className="primary" href="/">
                    进入我的生活
                    <ArrowUpRight size={14} />
                  </a>
                  <a className="secondary" href="/account?logout=1">
                    退出账号
                  </a>
                </div>
                {status.user.role === "owner" && (
                  <section className="invite-manager">
                    <h2>邀请朋友来试用</h2>
                    <p>
                      每个邀请码可注册一个账号，7
                      天内有效。把网站链接和邀请码私下发给朋友即可。
                    </p>
                    <form onSubmit={createInvite}>
                      <label htmlFor="invite-label">
                        邀请备注
                        <input
                          id="invite-label"
                          value={label}
                          maxLength={40}
                          placeholder="例如：给小林的邀请"
                          onChange={(e) => setLabel(e.target.value)}
                        />
                      </label>
                      <button className="primary" disabled={busy}>
                        <Plus size={14} />
                        生成邀请码
                      </button>
                    </form>
                    {newInvite && (
                      <div className="invite-result">
                        <p>新邀请码（只显示这一次）</p>
                        <code className="secret-code">{newInvite}</code>
                        <button
                          className="secondary"
                          onClick={() => copy(newInvite)}
                        >
                          <Copy size={14} />
                          {copied ? "已复制" : "复制邀请码"}
                        </button>
                        <p>
                          网站链接：
                          <a href="/">
                            {typeof location !== "undefined"
                              ? location.origin
                              : ""}
                          </a>
                        </p>
                      </div>
                    )}
                    <ul className="invite-list">
                      {invites.map((x) => (
                        <li key={x.id}>
                          <div>
                            <strong>{x.label}</strong>
                            <small>
                              {x.revoked
                                ? "已撤销"
                                : x.used
                                  ? "已使用"
                                  : Date.now() > x.expires_at
                                    ? "已过期"
                                    : "等待使用"}{" "}
                              ·{" "}
                              {new Date(x.expires_at).toLocaleDateString(
                                "zh-CN",
                              )}{" "}
                              到期
                            </small>
                          </div>
                          {!x.used &&
                            !x.revoked &&
                            Date.now() < x.expires_at && (
                              <button
                                className="text-button"
                                onClick={() => revoke(x.id)}
                              >
                                撤销
                              </button>
                            )}
                        </li>
                      ))}
                    </ul>
                    <p className="account-help">
                      第一步先建立站长账号，再开放朋友访问。朋友是否能进入，还取决于网站托管的访问范围。
                    </p>
                  </section>
                )}
              </>
            ) : (
              <>
                <p>
                  {setup
                    ? "使用用户名和密码继续管理网站，你现有的记录会关联到这个账号。"
                    : mode === "register"
                      ? "凭邀请码创建用户名和密码，每个人拥有自己的私人记录。"
                      : mode === "recover"
                        ? "输入注册时的用户名、恢复码和新密码。成功后，旧恢复码及所有用户名登录会话会失效。"
                        : "使用 Dlife 用户名和密码登录。"}
                </p>
                <form className="account-form" onSubmit={submit}>
                  <label htmlFor="member-username">
                    用户名
                    <input
                      id="member-username"
                      name="username"
                      autoComplete="username"
                      required
                      minLength={3}
                      maxLength={24}
                      pattern="[a-zA-Z0-9_]{3,24}"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="3–24 位字母、数字或下划线"
                    />
                  </label>
                  {mode === "register" && !setup && (
                    <label htmlFor="member-invite">
                      邀请码
                      <input
                        id="member-invite"
                        required
                        value={invite}
                        maxLength={100}
                        onChange={(e) => setInvite(e.target.value)}
                        autoComplete="off"
                        placeholder="由站长提供，一次性使用"
                      />
                    </label>
                  )}
                  {mode === "recover" && (
                    <label htmlFor="member-recovery">
                      恢复码
                      <input
                        id="member-recovery"
                        required
                        value={recovery}
                        maxLength={100}
                        onChange={(e) => setRecovery(e.target.value)}
                        autoComplete="off"
                      />
                    </label>
                  )}
                  <label htmlFor="member-password">
                    {mode === "recover" ? "新密码" : "密码"}
                    <input
                      id="member-password"
                      name="password"
                      type="password"
                      autoComplete={
                        mode === "login" ? "current-password" : "new-password"
                      }
                      required
                      minLength={mode === "login" ? 1 : 7}
                      maxLength={128}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={
                        mode === "login" ? "你的登录密码" : "至少 7 个字符"
                      }
                    />
                  </label>
                  {mode !== "login" && (
                    <label htmlFor="member-confirm">
                      再次输入密码
                      <input
                        id="member-confirm"
                        type="password"
                        autoComplete="new-password"
                        required
                        minLength={7}
                        maxLength={128}
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                      />
                    </label>
                  )}
                  <button className="primary account-wide" disabled={busy}>
                    {busy ? <LoaderCircle className="spin" size={15} /> : null}
                    {setup
                      ? "创建站长账号"
                      : mode === "register"
                        ? "注册我的账号"
                        : mode === "recover"
                          ? "重设密码"
                          : "登录我的空间"}
                  </button>
                </form>
                <div className="account-switch">
                  <button
                    onClick={() =>
                      changeMode(mode === "register" ? "login" : "register")
                    }
                  >
                    {mode === "register"
                      ? "已有账号，去登录"
                      : "收到邀请码？注册账号"}
                  </button>
                  <button
                    onClick={() =>
                      changeMode(mode === "recover" ? "login" : "recover")
                    }
                  >
                    {mode === "recover" ? "返回登录" : "忘记密码？"}
                  </button>
                </div>
                {status?.canSetupOwner && (
                  <div className="owner-setup">
                    <strong>你是当前网站的主人</strong>
                    <p>
                      先建立站长账号，就能生成朋友的邀请码，并保留现有记录。
                    </p>
                    <button
                      className="secondary"
                      onClick={() => changeMode("register", true)}
                    >
                      建立站长账号
                    </button>
                  </div>
                )}
                {!status?.user && (
                  <a
                    className="legacy-login"
                    href="/signin-with-chatgpt?return_to=%2Faccount"
                    target="_top"
                  >
                    站长原有 ChatGPT 登录入口
                  </a>
                )}
              </>
            )}
          </>
        )}
        {error && (
          <p className="account-error" role="alert">
            {error}
          </p>
        )}
      </section>
      <p className="account-bottom">生活是你的，空间也是。</p>
    </main>
  );
}
