"use client";
import {
  useEffect,
  useState,
  useRef,
  useId,
  type CSSProperties,
  type FormEvent,
} from "react";
import {
  BookOpen,
  CalendarDays,
  Activity,
  Sparkles,
  Palette,
  Plus,
  ArrowUpRight,
  Search,
  Image as ImageIcon,
  Film,
  X,
  ChevronLeft,
  ChevronRight,
  Send,
  Check,
  LockKeyhole,
  Pencil,
  Trash2,
  Download,
  Shuffle,
  Heart,
  LogOut,
  LoaderCircle,
  ArrowLeft,
} from "lucide-react";
type Media = { key: string; name: string; type: "image" | "video" };
type Entry = {
  id: string;
  day: string;
  title: string;
  body: string;
  media: Media[];
  created_at: string;
  updated_at: string;
};
type Mood = { day: string; score: number };
type Pet = {
  name: string;
  kind: "spirit" | "cat" | "bunny";
  color: string;
  seed: number;
  personality: "温柔倾听" | "活泼元气" | "安静陪伴";
};
type Prefs = {
  displayName: string;
  subtitle: string;
  background: string;
  accent: string;
  font: "sans" | "serif";
  layout: "comfortable" | "compact";
  pet: Pet;
};
type Message = { id: string; role: string; content: string };
const DEFAULT: Prefs = {
  displayName: "",
  subtitle: "把日子过成自己的样子。",
  background: "#101110",
  accent: "#c6d5a4",
  font: "sans",
  layout: "comfortable",
  pet: {
    name: "小光",
    kind: "spirit",
    color: "#d8e7b4",
    seed: 9,
    personality: "温柔倾听",
  },
};
const faces = ["有点低落", "不太开心", "平平淡淡", "心情不错", "非常开心"];
const date = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const short = (s: string) =>
  new Date(s + "T12:00:00").toLocaleDateString("zh-CN", {
    month: "long",
    day: "numeric",
  });
const moodColors = ["#b1aacd", "#9db3c7", "#c2c1ad", "#bdcf9c", "#e4c58e"];
async function api(path: string, method = "GET", data?: unknown): Promise<any> {
  const r = await fetch("/api/" + path, {
    method,
    headers: data ? { "Content-Type": "application/json" } : undefined,
    body: data ? JSON.stringify(data) : undefined,
  });
  const x: any = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(x.error || "暂时没有成功，请稍后再试");
  return x;
}
function Face({ score = 3, size = 25 }: { score?: number; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="11.5" cy="13.5" r="1.2" fill="currentColor" />
      <circle cx="20.5" cy="13.5" r="1.2" fill="currentColor" />
      {score <= 2 ? (
        <path
          d="M11 22 Q16 16 21 22"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      ) : score === 3 ? (
        <path
          d="M12 21h8"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      ) : (
        <path
          d={score === 5 ? "M10 19Q16 28 22 19Z" : "M11 19Q16 25 21 19"}
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}
function PetArt({ pet, large = false }: { pet: Pet; large?: boolean }) {
  const id = useId().replace(/:/g, "");
  return (
    <div className={"pet-art " + (large ? "large" : "")}>
      <div className="pet-aura" style={{ background: pet.color }} />
      <svg
        role="img"
        aria-label={`${pet.name}，${pet.kind === "cat" ? "猫咪" : pet.kind === "bunny" ? "兔子" : "小精灵"}`}
        viewBox="0 0 240 220"
      >
        <defs>
          <radialGradient id={id} cx="35%" cy="25%" r="85%">
            <stop offset="0" stopColor="#fffef0" />
            <stop offset=".5" stopColor={pet.color} />
            <stop offset="1" stopColor={pet.color} stopOpacity=".65" />
          </radialGradient>
        </defs>
        <ellipse
          cx="120"
          cy="194"
          rx="47"
          ry="7"
          fill={pet.color}
          opacity=".12"
        />
        <g className="pet-float">
          {pet.kind === "bunny" && (
            <>
              <ellipse
                cx="91"
                cy="57"
                rx="15"
                ry="40"
                transform="rotate(-13 91 57)"
                fill={`url(#${id})`}
              />
              <ellipse
                cx="147"
                cy="57"
                rx="15"
                ry="40"
                transform="rotate(13 147 57)"
                fill={`url(#${id})`}
              />
            </>
          )}
          {pet.kind === "cat" && (
            <>
              <path
                d="M65 92L69 40L111 74M130 74L172 40L176 95"
                fill={`url(#${id})`}
              />
            </>
          )}
          {pet.kind === "spirit" && (
            <path
              d="M108 74Q88 41 107 35Q113 51 130 55Q143 33 153 42Q157 54 142 72"
              fill={`url(#${id})`}
            />
          )}
          <path
            d="M58 123C58 88 79 68 119 68C161 68 182 89 182 122C182 153 162 178 148 177C138 177 139 169 128 173C114 185 105 177 97 174C84 185 58 158 58 123Z"
            fill={`url(#${id})`}
          />
          <ellipse
            cx="57"
            cy="140"
            rx="11"
            ry="20"
            transform="rotate(27 57 140)"
            fill={pet.color}
          />
          <ellipse
            cx="181"
            cy="140"
            rx="11"
            ry="20"
            transform="rotate(-27 181 140)"
            fill={pet.color}
          />
          <g className="pet-eyes">
            <ellipse
              cx={97 + (pet.seed % 4)}
              cy="121"
              rx="4.7"
              ry="6.3"
              fill="#333c2a"
            />
            <ellipse
              cx={141 - (pet.seed % 4)}
              cy="121"
              rx="4.7"
              ry="6.3"
              fill="#333c2a"
            />
            <circle cx="98" cy="119" r="1.4" fill="white" />
            <circle cx="140" cy="119" r="1.4" fill="white" />
          </g>
          <ellipse
            cx="83"
            cy="138"
            rx="10"
            ry="5"
            fill="#db9391"
            opacity=".35"
          />
          <ellipse
            cx="155"
            cy="138"
            rx="10"
            ry="5"
            fill="#db9391"
            opacity=".35"
          />
          <path
            d={
              pet.seed % 2
                ? "M111 138Q119 148 127 138"
                : "M113 139Q119 144 125 139"
            }
            fill="none"
            stroke="#4c563e"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </g>
        <g fill={pet.color} className="pet-stars">
          <path d="M39 65l2-6 2 6 6 2-6 2-2 6-2-6-6-2z" />
          <path d="M195 96l2-5 2 5 5 2-5 2-2 5-2-5-5-2z" />
          <circle cx="54" cy="172" r="2" />
          <circle cx="193" cy="48" r="2" />
        </g>
      </svg>
    </div>
  );
}
function Curve({
  moods,
  days = 7,
  onSelect,
}: {
  moods: Mood[];
  days?: number;
  onSelect?: (d: string) => void;
}) {
  const now = new Date(),
    dates = Array.from({ length: days }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (days - 1 - i));
      return date(d);
    });
  const points = dates.map((d, i) => {
    const m = moods.find((x) => x.day === d);
    return {
      day: d,
      x: 34 + i * (542 / (days - 1)),
      y: m ? 148 - (m.score - 1) * 28 : null,
      score: m?.score,
    };
  });
  const valid = points.filter((x) => x.y !== null);
  return (
    <div className="curve-wrap">
      <svg
        className="curve"
        viewBox="0 0 610 190"
        role="group"
        aria-label={`最近${days}天心情曲线，已评分${valid.length}天`}
      >
        <defs>
          <linearGradient id="curveFill" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="var(--accent)" stopOpacity=".2" />
            <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[1, 2, 3, 4, 5].map((s) => (
          <g key={s}>
            <line
              x1="34"
              x2="576"
              y1={148 - (s - 1) * 28}
              y2={148 - (s - 1) * 28}
              stroke="var(--border)"
              strokeDasharray="3 6"
            />
            <text
              x="13"
              y={153 - (s - 1) * 28}
              fill="var(--muted)"
              fontSize="10"
            >
              {s}
            </text>
          </g>
        ))}
        {points.map((p, i) => {
          const prev = points[i - 1];
          return p.y !== null && prev?.y !== null && prev?.y !== undefined ? (
            <g key={p.day}>
              <path
                d={`M${prev.x} 153L${prev.x} ${prev.y}L${p.x} ${p.y}L${p.x} 153Z`}
                fill="url(#curveFill)"
              />
              <line
                x1={prev.x}
                x2={p.x}
                y1={prev.y}
                y2={p.y}
                stroke="var(--accent)"
                strokeWidth="2"
              />
            </g>
          ) : null;
        })}
        {valid.map((p) => (
          <g
            key={p.day}
            className="chart-dot"
            tabIndex={0}
            role="button"
            aria-label={`${short(p.day)}，${p.score}分，查看当天记录`}
            onClick={() => onSelect?.(p.day)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") onSelect?.(p.day);
            }}
          >
            <circle cx={p.x} cy={p.y!} r="12" fill="transparent" />
            <circle
              cx={p.x}
              cy={p.y!}
              r="4"
              fill="var(--bg)"
              stroke="var(--accent)"
              strokeWidth="2"
            />
            <title>
              {short(p.day)} · {p.score} / 5
            </title>
          </g>
        ))}
        {points
          .filter((_, i) => days === 7 || i % 5 === 0 || i === days - 1)
          .map((p) => (
            <text
              key={p.day}
              x={p.x}
              y="179"
              textAnchor="middle"
              fill="var(--muted)"
              fontSize="10"
            >
              {p.day.slice(5).replace("-", "/")}
            </text>
          ))}
        {!valid.length && (
          <text
            x="305"
            y="96"
            textAnchor="middle"
            fill="var(--muted)"
            fontSize="13"
          >
            给今天的心情打个分，曲线就从这里开始。
          </text>
        )}
      </svg>
      <span className="chart-note">
        1 低落 · 3 平静 · 5 开心　/　未评分日期留空
      </span>
      <details className="curve-data">
        <summary>查看每日评分</summary>
        {valid.length ? (
          valid.map((p) => (
            <div key={p.day}>
              {p.day}　{p.score} / 5
            </div>
          ))
        ) : (
          <p>还没有评分记录。</p>
        )}
      </details>
    </div>
  );
}
export default function Journal({ signedIn }: { signedIn: boolean }) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const [view, setView] = useState("timeline"),
    [prefs, setPrefs] = useState<Prefs>(DEFAULT),
    [prefDraft, setPrefDraft] = useState<Prefs>(DEFAULT),
    [entries, setEntries] = useState<Entry[]>([]),
    [moods, setMoods] = useState<Mood[]>([]),
    [messages, setMessages] = useState<Message[]>([]),
    [loading, setLoading] = useState(signedIn),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [uploading, setUploading] = useState(false),
    [chatBusy, setChatBusy] = useState(false),
    [chatText, setChatText] = useState(""),
    [chatError, setChatError] = useState(""),
    [query, setQuery] = useState(""),
    [filter, setFilter] = useState(""),
    [range, setRange] = useState(7),
    [composer, setComposer] = useState(false),
    [entryDay, setEntryDay] = useState(date()),
    [title, setTitle] = useState(""),
    [content, setContent] = useState(""),
    [media, setMedia] = useState<Media[]>([]),
    [editId, setEditId] = useState<string | null>(null),
    [entryMood, setEntryMood] = useState<number | null>(null),
    [deletedId, setDeletedId] = useState<string | null>(null),
    [month, setMonth] = useState(
      new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    );
  const fileRef = useRef<HTMLInputElement>(null),
    chatEnd = useRef<HTMLDivElement>(null),
    mounted = useRef(false);
  const current = view === "customize" ? prefDraft : prefs;
  const rgb = current.background.match(/\w\w/g)!.map((x) => parseInt(x, 16));
  const light = rgb[0] * 0.299 + rgb[1] * 0.587 + rgb[2] * 0.114 > 160;
  const style = {
    "--onaccent":
      parseInt(current.accent.slice(1, 3), 16) * 0.299 +
        parseInt(current.accent.slice(3, 5), 16) * 0.587 +
        parseInt(current.accent.slice(5, 7), 16) * 0.114 >
      155
        ? "#20271a"
        : "#ffffff",
    "--bg": current.background,
    "--accent": current.accent,
    "--text": light ? "#252822" : "#eceee8",
    "--muted": light ? "#676c63" : "#969c90",
    "--panel": light ? "rgba(0,0,0,.025)" : "rgba(255,255,255,.025)",
    "--border": light ? "rgba(0,0,0,.1)" : "rgba(255,255,255,.09)",
    "--soft": light ? "rgba(0,0,0,.05)" : "rgba(255,255,255,.045)",
    "--font":
      current.font === "serif"
        ? 'Georgia,"Noto Serif SC","Songti SC",serif'
        : '-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC",sans-serif',
  } as CSSProperties;
  const todayMood = moods.find((m) => m.day === date())?.score;
  async function refresh() {
    const [e, m] = await Promise.all([api("entries"), api("moods")]);
    setEntries(e.entries);
    setMoods(m.moods);
  }
  useEffect(() => {
    if (!signedIn) return;
    let alive = true;
    Promise.all([api("entries"), api("moods"), api("preferences"), api("chat")])
      .then(([e, m, p, c]) => {
        if (!alive) return;
        setEntries(e.entries);
        setMoods(m.moods);
        if (p.preferences) {
          setPrefs(p.preferences);
          setPrefDraft(p.preferences);
        }
        setMessages(c.messages);
      })
      .catch((e) => setNotice(e.message))
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [signedIn]);
  useEffect(() => {
    if (notice) {
      const timer = setTimeout(() => setNotice(""), 6000);
      return () => clearTimeout(timer);
    }
  }, [notice]);
  useEffect(() => {
    if (mounted.current && view === "pet")
      chatEnd.current?.parentElement?.scrollTo({
        top: chatEnd.current.parentElement.scrollHeight,
      });
    mounted.current = true;
  }, [messages, chatBusy, view]);
  function go(v: string) {
    window.scrollTo(0, 0);
    setView(v);
    if (v === "customize") setPrefDraft(prefs);
  }
  function needLogin() {
    if (!signedIn) {
      setNotice("请先登录，开启属于自己的生活空间。");
      return true;
    }
    return false;
  }
  function openComposer(entry?: Entry) {
    if (needLogin()) return;
    setEditId(entry?.id || null);
    setEntryDay(entry?.day || date());
    setTitle(entry?.title || "");
    setContent(entry?.body || "");
    setMedia(entry?.media || []);
    setEntryMood(
      moods.find((m) => m.day === (entry?.day || date()))?.score || null,
    );
    setComposer(true);
  }
  async function saveEntry(e: FormEvent) {
    e.preventDefault();
    if (busy || uploading) return;
    setBusy(true);
    try {
      await api("entries", "POST", {
        id: editId || undefined,
        day: entryDay,
        title,
        body: content,
        media,
        mood: entryMood,
      });
      await refresh();
      setComposer(false);
      setNotice(editId ? "记录已更新" : "这一刻，已经替你收好了。");
    } catch (e) {
      setNotice((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function upload(files: FileList | null) {
    if (!files) return;
    setUploading(true);
    for (const file of Array.from(files).slice(
      0,
      Math.max(0, 6 - media.length),
    )) {
      try {
        if (file.size > 20 * 1024 * 1024)
          throw new Error(`${file.name} 超过 20 MB`);
        const form = new FormData();
        form.append("file", file);
        const r = await fetch("/api/media", { method: "POST", body: form });
        const m: any = await r.json();
        if (!r.ok) throw new Error(m.error);
        setMedia((old) => [...old, m]);
      } catch (e) {
        setNotice((e as Error).message);
      }
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }
  async function rate(score: number) {
    if (needLogin()) return;
    try {
      await api("moods", "POST", { day: date(), score });
      setMoods((old) => [
        ...old.filter((m) => m.day !== date()),
        { day: date(), score },
      ]);
      setNotice("今天的心情，记下来了。");
    } catch (e) {
      setNotice((e as Error).message);
    }
  }
  async function remove(id: string) {
    try {
      await api("entries", "DELETE", { id });
      setEntries((old) => old.filter((e) => e.id !== id));
      setDeletedId(id);
      setNotice("记录已移入回收状态，可撤销。");
    } catch (e) {
      setNotice((e as Error).message);
    }
  }
  async function undo() {
    if (!deletedId) return;
    try {
      await api("entries", "PATCH", { id: deletedId });
      await refresh();
      setDeletedId(null);
      setNotice("已恢复记录");
    } catch (e) {
      setNotice((e as Error).message);
    }
  }
  async function savePrefs() {
    if (needLogin()) return;
    setBusy(true);
    try {
      await api("preferences", "POST", prefDraft);
      setPrefs(prefDraft);
      setNotice("你的空间，已经焕然一新。");
    } catch (e) {
      setNotice((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function savePet(pet: Pet) {
    const p = { ...prefs, pet };
    try {
      await api("preferences", "POST", p);
      setPrefs(p);
      setPrefDraft(p);
      setNotice("小精灵已经记住了自己的模样。");
    } catch (e) {
      setNotice((e as Error).message);
    }
  }
  async function send(e: FormEvent) {
    e.preventDefault();
    if (needLogin() || chatBusy || !chatText.trim()) return;
    const msg = chatText.trim();
    setChatBusy(true);
    setChatError("");
    setChatText("");
    const temp = "pending-" + Date.now();
    setMessages((m) => [...m, { id: temp, role: "user", content: msg }]);
    try {
      const x = await api("chat", "POST", { message: msg });
      setMessages((m) => [...m, x.message]);
    } catch (e) {
      setMessages((m) => m.filter((x) => x.id !== temp));
      setChatText(msg);
      setChatError((e as Error).message);
    } finally {
      setChatBusy(false);
    }
  }
  function exportData() {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            exportedAt: new Date().toISOString(),
            entries,
            moods,
            preferences: prefs,
            messages,
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "Dlife-records-" + date() + ".json";
    a.click();
    URL.revokeObjectURL(a.href);
    setNotice("文字、评分、设置与聊天已导出；照片和视频请在记录中单独保存。");
  }
  const visible = entries.filter(
    (e) =>
      (!filter || e.day === filter) &&
      (e.title + " " + e.body).toLowerCase().includes(query.toLowerCase()),
  );
  const monthDays = Array.from(
    {
      length: new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate(),
    },
    (_, i) => date(new Date(month.getFullYear(), month.getMonth(), i + 1)),
  );
  const firstWeek = (month.getDay() + 6) % 7;
  useEffect(() => {
    if (!composer) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy && !uploading) setComposer(false);
      if (e.key === 'Tab') {
        const dialog = document.querySelector('[role="dialog"]');
        const items = Array.from(dialog?.querySelectorAll<HTMLElement>('button:not([disabled]),input:not([type="file"]):not([disabled]),textarea,select') || []);
        const first = items[0], last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
        if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [composer, busy, uploading]);
  if (!ready) return <div className="startup" role="status">Dlife · 拾光<span>正在打开你的生活空间…</span></div>;
  const nav = [
    { id: "timeline", icon: BookOpen, label: "我的生活" },
    { id: "curve", icon: Activity, label: "记忆曲线" },
    { id: "pet", icon: Sparkles, label: "我的小精灵" },
    { id: "customize", icon: Palette, label: "装扮空间" },
  ];
  return (
    <div
      className={"app " + (light ? "light " : "") + current.layout}
      style={style}
    >
      <aside className="sidebar">
        <a className="brand" href="/" aria-label="Dlife 首页">
          <span className="brand-mark">
            d<span>•</span>
          </span>
          <span>
            Dlife<span className="brand-cn">拾光</span>
          </span>
        </a>
        <div className="space-label">MY LITTLE UNIVERSE</div>
        <nav>
          {nav.map((n) => (
            <button
              key={n.id}
              className={view === n.id ? "active" : ""}
              onClick={() => go(n.id)}
            >
              <n.icon size={18} />
              <span>{n.label}</span>
              {view === n.id && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="small-note">
            <span>✳</span>
            <p>
              平凡的日子，
              <br />
              也有自己的光。
            </p>
          </div>
          <div className="profile">
            <span className="avatar">
              {(prefs.displayName || "我").slice(0, 1)}
            </span>
            <div>
              <strong>{prefs.displayName || "我的小小宇宙"}</strong>
              <small>{signedIn ? "私人生活空间" : "从今天，开始记录"}</small>
            </div>
            {signedIn && (
              <a
                href="/signout-with-chatgpt?return_to=%2F"
                target="_top"
                title="退出登录"
              >
                <LogOut size={16} />
              </a>
            )}
          </div>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <span className="breadcrumb">
            我的空间 <span>/</span> {nav.find((n) => n.id === view)?.label}
          </span>
          <div className="top-actions">
            <span className="private">
              <LockKeyhole size={12} />
              仅自己可见
            </span>
            {signedIn ? (
              <button className="primary small" onClick={() => openComposer()}>
                <Plus size={15} />
                记录此刻
              </button>
            ) : (
              <a
                className="primary small"
                href="/signin-with-chatgpt?return_to=%2F"
                target="_top"
              >
                开启我的空间
                <ArrowUpRight size={14} />
              </a>
            )}
          </div>
        </header>
        <div className="page-content">
          <div className="page-intro">
            <div>
              <div className="eyebrow">
                {view === "timeline"
                  ? "A LITTLE LIFE, WELL REMEMBERED"
                  : view === "curve"
                    ? "EVERY FEELING HAS ITS PLACE"
                    : view === "pet"
                      ? "A LITTLE COMPANY, EVERY DAY"
                      : "MAKE ROOM FOR YOURSELF"}
              </div>
              <h1>
                {view === "timeline"
                  ? prefs.displayName
                    ? prefs.displayName + " 的生活碎片"
                    : "生活，值得被记住。"
                  : view === "curve"
                    ? "每一种心情，都算数。"
                    : view === "pet"
                      ? "总有一束光，陪着你。"
                      : "这是你的空间。"}
              </h1>
              <p>
                {view === "timeline"
                  ? prefs.subtitle
                  : view === "curve"
                    ? "看见情绪的起伏，也看见一路走来的自己。"
                    : view === "pet"
                      ? "给它一个名字、一种模样，再聊聊今天。"
                      : "从颜色到留白，让这里更像你。"}
              </p>
            </div>
            <div className="today-stamp">
              <span>
                {new Date()
                  .toLocaleDateString("en-US", { month: "short" })
                  .toUpperCase()}
              </span>
              <strong>
                {new Date().getDate().toString().padStart(2, "0")}
              </strong>
              <small>
                {new Date().toLocaleDateString("zh-CN", { weekday: "long" })}
              </small>
            </div>
          </div>
          {!signedIn && (
            <div className="welcome-banner">
              <div>
                <strong>在这里，生活是唯一的主角。</strong>
                <p>登录后保存文字、照片、视频和心情，慢慢收集自己的日常。</p>
              </div>
              <a
                href="/signin-with-chatgpt?return_to=%2F"
                target="_top"
                className="primary"
              >
                开始记录
                <ArrowUpRight size={15} />
              </a>
            </div>
          )}
          {view === "timeline" && (
            <div className="dashboard-grid">
              <section className="feed">
                <button
                  className="quick-compose panel"
                  onClick={() => openComposer()}
                >
                  <span className="compose-avatar">
                    <Pencil size={20} />
                  </span>
                  <span>
                    <strong>今天，想留下什么？</strong>
                    <small>一句话、一张照片，或一个小小的瞬间。</small>
                  </span>
                  <Plus className="compose-plus" size={22} />
                  <span className="compose-footer">
                    <span>
                      <ImageIcon size={15} />
                      照片
                    </span>
                    <span>
                      <Film size={15} />
                      视频
                    </span>
                    <span>
                      <Heart size={15} />
                      心情
                    </span>
                    <span className="compose-hint">
                      写下这一刻 <ArrowUpRight size={13} />
                    </span>
                  </span>
                </button>
                <div className="feed-tools">
                  <div className="section-title">
                    <span className="tiny-dot" />
                    生活时间线 <span className="count">{entries.length}</span>
                  </div>
                  <div className="search">
                    <Search size={14} />
                    <input
                      aria-label="搜索生活记录"
                      placeholder="寻找一个瞬间"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </div>
                </div>
                {filter && (
                  <div className="filter-chip">
                    {short(filter)}
                    <button
                      onClick={() => setFilter("")}
                      aria-label="清除日期筛选"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
                {loading ? (
                  <div className="empty">
                    <LoaderCircle className="spin" />
                    正在打开你的生活记录…
                  </div>
                ) : visible.length ? (
                  <div className="entry-list">
                    {visible.map((entry) => (
                      <article className="entry panel" key={entry.id}>
                        <div className="entry-top">
                          <time dateTime={entry.day}>
                            <strong>
                              {new Date(entry.day + "T12:00:00")
                                .getDate()
                                .toString()
                                .padStart(2, "0")}
                            </strong>
                            <span>
                              {new Date(
                                entry.day + "T12:00:00",
                              ).toLocaleDateString("zh-CN", {
                                month: "long",
                                weekday: "short",
                              })}
                            </span>
                          </time>
                          <div className="entry-actions">
                            <button
                              aria-label="编辑记录"
                              onClick={() => openComposer(entry)}
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              aria-label="删除记录"
                              onClick={() => remove(entry.id)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        {entry.title && <h2>{entry.title}</h2>}
                        {entry.body && (
                          <p className="entry-body">{entry.body}</p>
                        )}
                        {!!entry.media.length && (
                          <div
                            className={"media-grid count-" + entry.media.length}
                          >
                            {entry.media.map((m) =>
                              m.type === "image" ? (
                                <a
                                  key={m.key}
                                  href={
                                    "/api/media?key=" +
                                    encodeURIComponent(m.key)
                                  }
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  <img
                                    src={
                                      "/api/media?key=" +
                                      encodeURIComponent(m.key)
                                    }
                                    alt={m.name}
                                    loading="lazy"
                                  />
                                </a>
                              ) : (
                                <video
                                  key={m.key}
                                  src={
                                    "/api/media?key=" +
                                    encodeURIComponent(m.key)
                                  }
                                  controls
                                  preload="metadata"
                                  aria-label={m.name}
                                />
                              ),
                            )}
                          </div>
                        )}
                        <footer>
                          <span>
                            <LockKeyhole size={11} />
                            私密记录
                          </span>
                          {moods.find((m) => m.day === entry.day) && (
                            <span className="entry-mood">
                              <Face
                                size={17}
                                score={
                                  moods.find((m) => m.day === entry.day)!.score
                                }
                              />
                              {
                                faces[
                                  moods.find((m) => m.day === entry.day)!
                                    .score - 1
                                ]
                              }
                            </span>
                          )}
                        </footer>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="empty timeline-empty">
                    <div className="empty-art">
                      <div className="paper paper-back" />
                      <div className="paper paper-front">
                        <span>✳</span>
                        <i />
                        <i />
                        <i />
                      </div>
                      <span className="empty-spark">+</span>
                    </div>
                    <h2>
                      {query || filter
                        ? "还没找到这个瞬间"
                        : "故事，就从今天开始。"}
                    </h2>
                    <p>
                      {query || filter
                        ? "换个关键词，或清除日期筛选试试。"
                        : "不用等特别的日子。今天的晚风、好吃的一餐，\n都值得被好好收藏。"}
                    </p>
                    {!query && !filter && (
                      <button
                        className="text-button"
                        onClick={() => openComposer()}
                      >
                        写下第一条记录
                        <ArrowUpRight size={15} />
                      </button>
                    )}
                  </div>
                )}
                <div className="feed-end">
                  <span />
                  用自己的节奏，记录生活。
                  <span />
                </div>
              </section>
              <aside className="right-rail">
                <section className="panel mood-card">
                  <div className="section-title">
                    今天的你，感觉怎样？
                    <span className="soft-tag">
                      {todayMood ? "已记录" : "每日心情"}
                    </span>
                  </div>
                  <p className="card-sub">不需要解释，感受本身就有意义。</p>
                  <div className="mood-picker">
                    {faces.map((f, i) => (
                      <button
                        key={f}
                        title={f}
                        aria-label={`${i + 1}分，${f}`}
                        aria-pressed={todayMood === i + 1}
                        onClick={() => rate(i + 1)}
                        style={
                          {
                            "--mood-color": light
                              ? [
                                  "#7f6993",
                                  "#5d7e9b",
                                  "#7b7863",
                                  "#667d40",
                                  "#a07934",
                                ][i]
                              : moodColors[i],
                          } as CSSProperties
                        }
                        className={todayMood === i + 1 ? "selected" : ""}
                      >
                        <Face score={i + 1} size={31} />
                        <span>
                          {["低落", "难过", "平静", "不错", "开心"][i]}
                        </span>
                      </button>
                    ))}
                  </div>
                </section>
                <section className="panel calendar-card">
                  <div className="calendar-head">
                    <strong>
                      {month.getFullYear()} 年 {month.getMonth() + 1} 月
                    </strong>
                    <div>
                      <button
                        aria-label="上个月"
                        onClick={() =>
                          setMonth(
                            new Date(
                              month.getFullYear(),
                              month.getMonth() - 1,
                              1,
                            ),
                          )
                        }
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button
                        aria-label="下个月"
                        onClick={() =>
                          setMonth(
                            new Date(
                              month.getFullYear(),
                              month.getMonth() + 1,
                              1,
                            ),
                          )
                        }
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="calendar-grid">
                    {["一", "二", "三", "四", "五", "六", "日"].map((d) => (
                      <span className="week" key={d}>
                        {d}
                      </span>
                    ))}
                    {Array.from({ length: firstWeek }, (_, i) => (
                      <span key={"space" + i} />
                    ))}
                    {monthDays.map((d) => (
                      <button
                        key={d}
                        className={
                          (d === date() ? "today " : "") +
                          (filter === d ? "chosen" : "")
                        }
                        onClick={() => setFilter(filter === d ? "" : d)}
                        aria-label={`${d}${entries.some((e) => e.day === d) ? "，有记录" : ""}`}
                      >
                        <span>{Number(d.slice(-2))}</span>
                        {entries.some((e) => e.day === d) && <i />}
                      </button>
                    ))}
                  </div>
                  <div className="calendar-foot">
                    <span>
                      <i />
                      留下过生活的日子
                    </span>
                    <button
                      onClick={() => {
                        setMonth(
                          new Date(
                            new Date().getFullYear(),
                            new Date().getMonth(),
                            1,
                          ),
                        );
                        setFilter("");
                      }}
                    >
                      回到今天
                    </button>
                  </div>
                </section>
                <section className="panel pet-card">
                  <div className="section-title">
                    <Sparkles size={14} />
                    我的小精灵
                    <span className="status-dot" />
                  </div>
                  <PetArt pet={prefs.pet} />
                  <h3>{prefs.pet.name}</h3>
                  <p>
                    今天发生了什么？
                    <br />
                    我在这里，听你慢慢说。
                  </p>
                  <button className="secondary" onClick={() => go("pet")}>
                    聊一会儿
                    <ArrowUpRight size={14} />
                  </button>
                  <button className="pet-custom-link" onClick={() => go("pet")}>
                    换一种模样
                  </button>
                </section>
              </aside>
            </div>
          )}
          {view === "curve" && (
            <div className="curve-page">
              <section className="panel big-chart">
                <div className="chart-header">
                  <div>
                    <h2>我的心情曲线</h2>
                    <p>每天一笔，连成属于你的记忆。</p>
                  </div>
                  <div className="segmented">
                    {[7, 30].map((n) => (
                      <button
                        key={n}
                        className={range === n ? "active" : ""}
                        onClick={() => setRange(n)}
                      >
                        近 {n} 天
                      </button>
                    ))}
                  </div>
                </div>
                <Curve
                  moods={moods}
                  days={range}
                  onSelect={(d) => {
                    setFilter(d);
                    go("timeline");
                  }}
                />
              </section>
              <div className="curve-lower">
                <section className="panel mood-card">
                  <h2>今天，留一份感受</h2>
                  <p className="card-sub">
                    可以随时调整，保留当天最后一次评分。
                  </p>
                  <div className="mood-picker">
                    {faces.map((f, i) => (
                      <button
                        key={f}
                        className={todayMood === i + 1 ? "selected" : ""}
                        onClick={() => rate(i + 1)}
                        aria-label={`${i + 1}分，${f}`}
                        aria-pressed={todayMood === i + 1}
                        style={
                          {
                            "--mood-color": light
                              ? [
                                  "#7f6993",
                                  "#5d7e9b",
                                  "#7b7863",
                                  "#667d40",
                                  "#a07934",
                                ][i]
                              : moodColors[i],
                          } as CSSProperties
                        }
                      >
                        <Face score={i + 1} size={32} />
                        <span>{f}</span>
                      </button>
                    ))}
                  </div>
                </section>
                <section className="panel reflection">
                  <span>✳</span>
                  <h3>起伏，是生活原本的形状。</h3>
                  <p>
                    这里没有好坏排名，也没有必须向上的曲线。
                    <br />
                    你只需要诚实地感受，慢慢地生活。
                  </p>
                  <small>心情评分用于个人回顾，不代表健康评估。</small>
                </section>
              </div>
            </div>
          )}
          {view === "pet" && (
            <div className="pet-page">
              <section className="panel pet-studio">
                <div className="section-title">
                  <Sparkles size={15} />
                  精灵小屋<span className="soft-tag">可自由定制</span>
                </div>
                <PetArt pet={prefs.pet} large />
                <div className="pet-studio-title">
                  <h2>{prefs.pet.name}</h2>
                  <span>{prefs.pet.personality}</span>
                </div>
                <PetEditor
                  pet={prefs.pet}
                  onSave={(p) => {
                    if (!needLogin()) savePet(p);
                  }}
                />
              </section>
              <section className="panel chat-panel">
                <div className="chat-head">
                  <span className="chat-avatar">
                    <Sparkles size={19} />
                  </span>
                  <div>
                    <strong>和{prefs.pet.name}聊聊天</strong>
                    <small>AI 陪伴 · 听你分享生活</small>
                  </div>
                </div>
                <div className="chat-messages">
                  {!messages.length && (
                    <div className="chat-empty">
                      <span>✦</span>
                      <h3>从一句“你好”开始。</h3>
                      <p>分享一件小事，或者只是在这里坐一会儿。</p>
                      <div>
                        {["今天有一件开心的事", "我有点累，想聊聊"].map((s) => (
                          <button key={s} onClick={() => setChatText(s)}>
                            {s}
                            <ArrowUpRight size={12} />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {messages.map((m) => (
                    <div className={"message " + m.role} key={m.id}>
                      {m.role === "assistant" && (
                        <span className="message-icon">✦</span>
                      )}
                      <p>{m.content}</p>
                    </div>
                  ))}
                  {chatBusy && (
                    <div className="message assistant">
                      <span className="message-icon">✦</span>
                      <p className="typing">● ● ●</p>
                    </div>
                  )}
                  <div ref={chatEnd} />
                </div>
                {chatError && (
                  <div className="chat-error" role="alert">
                    {chatError}
                  </div>
                )}
                <form className="chat-input" onSubmit={send}>
                  <label className="sr-only" htmlFor="chat-message">
                    给小精灵发消息
                  </label>
                  <input
                    id="chat-message"
                    maxLength={1500}
                    value={chatText}
                    onChange={(e) => setChatText(e.target.value)}
                    placeholder="和我说说今天吧…"
                    disabled={chatBusy}
                  />
                  <button
                    type="submit"
                    disabled={chatBusy || !chatText.trim()}
                    aria-label="发送消息"
                  >
                    {chatBusy ? (
                      <LoaderCircle size={17} className="spin" />
                    ) : (
                      <Send size={17} />
                    )}
                  </button>
                </form>
                <p className="chat-note">
                  只会发送聊天内容，不会自动读取你的日记和附件。
                </p>
              </section>
            </div>
          )}
          {view === "customize" && (
            <div className="customize-page">
              <section className="panel settings-panel">
                <div className="section-title">
                  <Palette size={16} />
                  装扮我的空间
                </div>
                <label>
                  空间主人
                  <input
                    value={prefDraft.displayName}
                    maxLength={30}
                    placeholder="你希望被怎样称呼？"
                    onChange={(e) =>
                      setPrefDraft({
                        ...prefDraft,
                        displayName: e.target.value,
                      })
                    }
                  />
                </label>
                <label>
                  一句属于你的话
                  <input
                    value={prefDraft.subtitle}
                    maxLength={100}
                    onChange={(e) =>
                      setPrefDraft({ ...prefDraft, subtitle: e.target.value })
                    }
                  />
                </label>
                <fieldset>
                  <legend>空间配色</legend>
                  <div className="theme-presets">
                    {[
                      { name: "静夜黑", bg: "#101110", a: "#c6d5a4" },
                      { name: "暖白纸", bg: "#f4f1e9", a: "#637446" },
                      { name: "暮色蓝", bg: "#141c27", a: "#a7c7db" },
                      { name: "莓果紫", bg: "#211923", a: "#d8b4cf" },
                    ].map((t) => (
                      <button
                        key={t.name}
                        className={
                          prefDraft.background === t.bg ? "chosen" : ""
                        }
                        onClick={() =>
                          setPrefDraft({
                            ...prefDraft,
                            background: t.bg,
                            accent: t.a,
                          })
                        }
                      >
                        <span style={{ background: t.bg, borderColor: t.a }}>
                          <i style={{ background: t.a }} />
                        </span>
                        {t.name}
                      </button>
                    ))}
                  </div>
                  <div className="color-fields">
                    <label>
                      背景颜色
                      <input
                        type="color"
                        value={prefDraft.background}
                        onChange={(e) =>
                          setPrefDraft({
                            ...prefDraft,
                            background: e.target.value,
                          })
                        }
                      />
                    </label>
                    <label>
                      点缀颜色
                      <input
                        type="color"
                        value={prefDraft.accent}
                        onChange={(e) =>
                          setPrefDraft({ ...prefDraft, accent: e.target.value })
                        }
                      />
                    </label>
                  </div>
                </fieldset>
                <fieldset>
                  <legend>文字气质</legend>
                  <div className="choice-row">
                    <button
                      className={prefDraft.font === "sans" ? "chosen" : ""}
                      onClick={() =>
                        setPrefDraft({ ...prefDraft, font: "sans" })
                      }
                    >
                      简洁现代 <span>Aa</span>
                    </button>
                    <button
                      className={
                        prefDraft.font === "serif" ? "chosen serif" : "serif"
                      }
                      onClick={() =>
                        setPrefDraft({ ...prefDraft, font: "serif" })
                      }
                    >
                      纸上书写 <span>Aa</span>
                    </button>
                  </div>
                </fieldset>
                <fieldset>
                  <legend>记录的留白</legend>
                  <div className="choice-row">
                    <button
                      className={
                        prefDraft.layout === "comfortable" ? "chosen" : ""
                      }
                      onClick={() =>
                        setPrefDraft({ ...prefDraft, layout: "comfortable" })
                      }
                    >
                      舒展一些
                    </button>
                    <button
                      className={prefDraft.layout === "compact" ? "chosen" : ""}
                      onClick={() =>
                        setPrefDraft({ ...prefDraft, layout: "compact" })
                      }
                    >
                      紧凑一些
                    </button>
                  </div>
                </fieldset>
                <div className="settings-actions">
                  <button
                    className="text-button"
                    onClick={() =>
                      setPrefDraft({
                        ...DEFAULT,
                        displayName: prefDraft.displayName,
                        subtitle: prefDraft.subtitle,
                        pet: prefDraft.pet,
                      })
                    }
                  >
                    恢复默认外观
                  </button>
                  <button
                    className="primary"
                    disabled={busy}
                    onClick={savePrefs}
                  >
                    {busy ? (
                      <LoaderCircle size={15} className="spin" />
                    ) : (
                      <Check size={15} />
                    )}
                    保存装扮
                  </button>
                </div>
              </section>
              <aside>
                <section className="panel preview-note">
                  <span>✳</span>
                  <h2>
                    颜色一变，
                    <br />
                    心情也换个频道。
                  </h2>
                  <p>
                    当前页面正在实时预览你的选择。
                    <br />
                    点「保存装扮」，下次回来还是你的样子。
                  </p>
                </section>
                <section className="panel data-panel">
                  <h3>把回忆握在自己手里</h3>
                  <p>导出文字、每日评分、设置和聊天记录。附件需单独保存。</p>
                  <button
                    className="secondary"
                    onClick={() => {
                      if (!needLogin()) exportData();
                    }}
                  >
                    <Download size={15} />
                    导出我的记录
                  </button>
                </section>
              </aside>
            </div>
          )}
          <footer className="page-footer">
            <span>Dlife · 拾光</span>
            <span>生活是你的，空间也是。</span>
            <span>
              <LockKeyhole size={11} />
              为自己记录
            </span>
          </footer>
        </div>
      </main>
      {notice && (
        <div className="toast" role="status">
          <Check size={16} />
          {notice}
          {deletedId && <button onClick={undo}>撤销删除</button>}
          <button aria-label="关闭提示" onClick={() => setNotice("")}>
            <X size={14} />
          </button>
        </div>
      )}
      {composer && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget && !busy && !uploading)
              setComposer(false);
          }}
        >
          <section
            className="composer-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="composer-title"
          >
            <div className="modal-head">
              <div>
                <span className="eyebrow">A MOMENT TO KEEP</span>
                <h2 id="composer-title">
                  {editId ? "重新整理这一刻" : "留住一个生活瞬间"}
                </h2>
              </div>
              <button
                aria-label="关闭编辑器"
                onClick={() => setComposer(false)}
                disabled={busy || uploading}
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={saveEntry}>
              <div className="composer-date">
                <CalendarDays size={16} />
                <label htmlFor="entry-day">记录日期</label>
                <input
                  id="entry-day"
                  type="date"
                  value={entryDay}
                  required
                  onChange={(e) => {
                    setEntryDay(e.target.value);
                    setEntryMood(
                      moods.find((m) => m.day === e.target.value)?.score ||
                        null,
                    );
                  }}
                />
              </div>
              <input
                className="title-input"
                aria-label="记录标题"
                placeholder="给这一刻取个名字（选填）"
                value={title}
                maxLength={120}
                onChange={(e) => setTitle(e.target.value)}
              />
              <textarea
                autoFocus
                aria-label="生活记录内容"
                placeholder="今天发生了什么？想到哪里，就写到哪里…"
                value={content}
                maxLength={12000}
                onChange={(e) => setContent(e.target.value)}
              />
              {!!media.length && (
                <div className="attachments">
                  {media.map((m) => (
                    <div key={m.key}>
                      {m.type === "image" ? (
                        <img
                          src={"/api/media?key=" + encodeURIComponent(m.key)}
                          alt={m.name}
                        />
                      ) : (
                        <video
                          src={"/api/media?key=" + encodeURIComponent(m.key)}
                          controls
                          preload="metadata"
                        />
                      )}
                      <button
                        type="button"
                        aria-label={`移除${m.name}`}
                        onClick={() =>
                          setMedia((old) => old.filter((x) => x.key !== m.key))
                        }
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                className="sr-only"
                multiple
                accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/quicktime,video/webm"
                onChange={(e) => upload(e.target.files)}
              />
              <div className="attachment-actions">
                <button
                  className="text-button"
                  type="button"
                  disabled={uploading || media.length >= 6}
                  onClick={() => fileRef.current?.click()}
                >
                  {uploading ? (
                    <LoaderCircle size={16} className="spin" />
                  ) : (
                    <ImageIcon size={16} />
                  )}
                  添加照片 / 视频
                </button>
                <span>最多 6 个 · 每个 20 MB</span>
              </div>
              <div className="composer-mood">
                <span>
                  这一天的心情 <small>（选填）</small>
                </span>
                <div>
                  {faces.map((f, i) => (
                    <button
                      key={f}
                      type="button"
                      aria-label={`记录心情${i + 1}分，${f}`}
                      aria-pressed={entryMood === i + 1}
                      title={f}
                      className={entryMood === i + 1 ? "selected" : ""}
                      onClick={() =>
                        setEntryMood(entryMood === i + 1 ? null : i + 1)
                      }
                    >
                      <Face score={i + 1} size={25} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="composer-bottom">
                <span>
                  <LockKeyhole size={12} />
                  只为自己记录
                </span>
                <button
                  className="primary"
                  type="submit"
                  disabled={
                    busy ||
                    uploading ||
                    (!content.trim() && !title.trim() && !media.length)
                  }
                >
                  {busy ? (
                    <LoaderCircle size={16} className="spin" />
                  ) : (
                    <Check size={16} />
                  )}
                  保存这一刻
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
function PetEditor({ pet, onSave }: { pet: Pet; onSave: (p: Pet) => void }) {
  const [draft, setDraft] = useState(pet);
  useEffect(() => setDraft(pet), [pet]);
  function random() {
    const colors = ["#d8e7b4", "#d1b6e4", "#a4d6df", "#efc3a3", "#d6c5a1"];
    const kinds: Pet["kind"][] = ["spirit", "cat", "bunny"];
    const next = {
      ...draft,
      color: colors[Math.floor(Math.random() * colors.length)],
      kind: kinds[Math.floor(Math.random() * 3)],
      seed: Math.floor(Math.random() * 999999),
    };
    setDraft(next);
  }
  return (
    <div className="pet-editor">
      <div className="pet-draft-preview">
        <PetArt pet={draft} />
      </div>
      <label>
        它的名字
        <input
          maxLength={20}
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
        />
      </label>
      <fieldset>
        <legend>精灵的模样</legend>
        <div className="choice-row">
          {(["spirit", "cat", "bunny"] as const).map((k, i) => (
            <button
              className={draft.kind === k ? "chosen" : ""}
              key={k}
              onClick={() => setDraft({ ...draft, kind: k })}
            >
              {["小光团", "小猫咪", "长耳兔"][i]}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="pet-color-row">
        <label>
          精灵颜色
          <input
            type="color"
            value={draft.color}
            onChange={(e) => setDraft({ ...draft, color: e.target.value })}
          />
        </label>
        <button className="text-button" onClick={random}>
          <Shuffle size={14} />
          生成一只
        </button>
      </div>
      <label>
        陪伴的性格
        <select
          value={draft.personality}
          onChange={(e) =>
            setDraft({
              ...draft,
              personality: e.target.value as Pet["personality"],
            })
          }
        >
          {["温柔倾听", "活泼元气", "安静陪伴"].map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
      </label>
      <button
        className="primary pet-save"
        disabled={!draft.name.trim()}
        onClick={() => onSave(draft)}
      >
        <Check size={15} />
        让它成为我的小精灵
      </button>
    </div>
  );
}
