# dlife日志

以个人日记为核心的开源网站。复古纸页、衬线字体与墨色装帧，支持文字、照片、视频、绘画与每日心情回顾。每个人的记录按账号隔离。

## 功能

- 日记目录：新建、编辑、搜索、日期筛选、删除与当前会话内撤销。
- 照片编辑：在日记草稿的图片下点击「编辑」，调整画幅、裁剪缩放和位置、90 度旋转、亮度、对比度或黑白效果。点击「保存照片」替换草稿附件，再点击「收进日记」提交整篇记录。
- 心情画板：在发布区点击「画下心情」，使用画笔、橡皮、选色与粗细，支持撤销/重做；「加入日记」生成 PNG 附件。绘画支持鼠标、手指和触控笔。
- 每篇最多 6 个附件，每个最大 20 MB。照片支持 JPG、PNG、GIF、WebP，视频支持 MP4、MOV、WebM。编辑照片导出最长边不超过 1600 像素的 PNG，GIF 编辑后保存为静态图。
- 每日主动选择 1–5 分心情，近 7/30 天曲线仅展示实际评分，未评分日期留空。
- 自定义纸张配色、字体、签名和留白；旧版外观第一次进入新版时切换到纸页默认主题，保存装帧后记住新选择。
- 私密日记文字、评分和设置可导出 JSON；图片和视频需单独保存。

小宠物、定制精灵与 AI 聊天功能已移除。现有日记、账号及历史数据库表不受本次界面更新影响，不执行删除历史数据的迁移。当前功能不需要 OpenAI API 密钥。

## 独立账号与朋友内测

- 使用 Better Auth 处理用户名、密码与登录会话；不收集邮箱。库的内部 email 字段使用随机不可投递的 `.invalid` 地址，不发送邮件。
- 密码至少 7 个字符。每个邀请码仅可注册一次，7 天有效，站长可以撤销未使用的邀请码。
- 注册时显示一次恢复码；服务端只保存摘要。重设密码后旧恢复码与旧登录会话失效。
- 每个人只能读写自己的日记、心情、设置和附件；只有站长可以管理邀请码。
- 网站入口公开与个人数据公开是不同的设置。Sites 的公网入口允许访问登录页，日记与附件仍在服务端核验身份。

新项目初始化时，先保持 Sites 主人私有访问，配置新的 `DLIFE_AUTH_SECRET`（至少 32 字符）、本站 `DLIFE_AUTH_URL` 和 `DLIFE_OWNER_SETUP=enabled`。站长通过既有 ChatGPT 登录建立独立账号后，关闭初始化（设为 `disabled`）并重新部署，再决定开放访问范围。不要在公开的空数据库上启用站长初始化。部署到其他平台需要重新设计可信的站长初始化边界。

当前 Dlife 原站已完成站长初始化，入口已公开、初始化已关闭；部分国内朋友仍遇到平台 Cloudflare 拦截，工单正由平台调查。本次改版不代表该平台访问问题已解决。

## 桌面入口

`/install` 提供 Mac Chrome 和 Windows Chrome/Edge 的安装说明。当前是需要联网的网页应用（PWA），不是原生 `.exe` 或 `.dmg`。Service Worker 仅缓存通用离线说明和图标，不缓存日记、附件、账号页面或接口数据。安装与实际触控设备体验需要在用户设备上验证。

## 源码结构

| 文件 | 用途 |
| --- | --- |
| `app/journal.tsx` | 日记页面、草稿、心情与装帧 |
| `app/creative-tools.tsx` | 本地照片编辑与心情画板 |
| `app/globals.css` | 纸页外观和响应式布局 |
| `app/api/entries/route.ts` | 日记读写与权限检查 |
| `app/api/media/route.ts` | 私人图片、画作与视频存储 |
| `app/api/preferences/route.ts` | 装帧设置 |
| `app/api/members/` | 邀请注册、恢复与账号管理 |
| `db/schema.ts`、`drizzle/` | 数据库结构与迁移 |
| `.openai/hosting.json` | 原站托管身份与存储绑定 |

照片编辑和绘画发生在浏览器里；只有点击保存图片/加入日记时，图片才上传到当前账号的私有存储。新图使用新的附件标识，不覆写其他日记所引用的原图。画板以 PNG 保存，不保存可再次逐笔编辑的绘图工程。关闭编辑器会丢弃尚未加入日记的画布内容。未提供自动清理未引用附件或附件一键导出的功能。

## 本地运行

需要 Node.js 22.13 或更新版本。

```sh
npm ci
node scripts/init-local-auth.mjs
npm run build
```

将尚未执行的迁移依次应用到本地数据库，执行过的不要重复执行：

```sh
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_gorgeous_karen_page.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0001_rich_mentor.sql
npm run dev -- --hostname 127.0.0.1
```

打开终端打印的地址。本地模拟站长账号仅用于 loopback 开发模式，本地数据与线上数据互相独立。请勿提交 `.env.local`、`.dev.vars`、密钥或本地数据库。

## 托管与开源

原站通过 Sites 的 Cloudflare Worker、D1 与 R2 运行。GitHub 保存源码，不保存用户日记、媒体文件、密码或密钥。GitHub Pages 不能直接承载全部服务端功能。其他平台部署需要适配运行环境、数据库、文件存储与站长身份，不是复制静态文件即可完成。

自建新实例请使用自己的项目身份和服务端密钥，不要复用原站配置或信任来自公网的身份请求头。当前未提供社交关注、公开日记、视频剪辑或离线写作。

自编写代码采用 MIT License，保留模板、依赖与第三方脚本原有许可证。
