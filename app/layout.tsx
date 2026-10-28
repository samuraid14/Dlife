import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Dlife · 拾光 — 把生活留给自己",
  description: "记录生活、感受情绪，在自己的空间里，和一只小精灵慢慢长大。",
  icons: { icon: "/favicon.svg" },
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
