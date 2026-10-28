"use client";
import { useEffect, useState } from "react";
import { Download } from "lucide-react";
type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};
export default function DesktopInstall({ instructions = false }: { instructions?: boolean }) {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null),
    [installed, setInstalled] = useState(false);
  useEffect(() => {
    setInstalled(window.matchMedia("(display-mode: standalone)").matches);
    const save = (e: Event) => {
      e.preventDefault();
      setPrompt(e as InstallPrompt);
    };
    const done = () => {
      setInstalled(true);
      setPrompt(null);
    };
    window.addEventListener("beforeinstallprompt", save);
    window.addEventListener("appinstalled", done);
    if ("serviceWorker" in navigator)
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch(() => {});
    return () => {
      window.removeEventListener("beforeinstallprompt", save);
      window.removeEventListener("appinstalled", done);
    };
  }, []);
  if (installed) return <span className="desktop-installed">桌面版</span>;
  return prompt ? (
    <button
      className="text-button install-link"
      onClick={async () => {
        await prompt.prompt();
        await prompt.userChoice;
        setPrompt(null);
      }}
    >
      <Download size={13} />
      安装桌面版
    </button>
  ) : (
    <a className="text-button install-link" href={instructions ? "#manual" : "/install"}>
      <Download size={13} />
      {instructions ? "查看安装步骤" : "安装桌面版"}
    </a>
  );
}
