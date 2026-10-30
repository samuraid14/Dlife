import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "dlife日志 — 私人的纸上生活",
  description: "用文字、照片与绘画记录日常，收藏每一天的心情。",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "dlife日志",
    statusBarStyle: "black-translucent",
  },
  icons: { icon: "/favicon.svg", apple: "/icons/icon-192.png" },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
