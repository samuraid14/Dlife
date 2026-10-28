# Dlife · 拾光

一个以个人生活记录为核心的开源网站。默认黑色界面，支持文字、照片、视频、每日心情曲线和可定制的 AI 小精灵。

## 功能

- 私人生活时间线：新建、编辑、搜索、日期筛选，以及删除后撤销。
- 上传 JPG、PNG、GIF、WebP 照片和 MP4、MOV、WebM 视频。每条最多 6 个附件，单文件最大 20 MB。
- 每天主动选择 1–5 分心情；近 7 / 30 天曲线只显示真实评分，缺失日期留空。点击曲线中的日期查看生活记录。
- 定制精灵名字、颜色、外形和陪伴性格；「生成一只」通过程序生成精灵组合，无图片生成费用。
- AI 聊天通过服务端 OpenAI Responses API 提供。只发送聊天内容，不会自动发送日记、照片、视频或心情。最近 12 条聊天作为上下文，每个用户每天最多 50 次成功请求。
- 自定义背景、点缀色、字体和记录留白，设置随账号保存。
- 导出文字、评分、设置、聊天的 JSON 文件；附件需单独保存。

## 隐私与存储

源码公开不代表用户数据公开。所有日记、评分、设置、附件和聊天接口均要求登录，并按服务端用户 ID 限定访问。结构化数据保存在 D1，媒体保存在 R2。网页不包含 API 密钥。

托管版本使用 Sites 提供的 ChatGPT 登录和请求身份。生产环境必须保留这一身份边界；直接部署到其他平台时，需要自行接入可信的身份服务，不能直接信任来自公网的 `oai-authenticated-user-*` 请求头。

本地开发使用 starter 的模拟账号 `Seedy`，仅在 loopback 开发模式可用。开发数据和线上数据互相独立。

## 从零读懂文件

| 文件                       | 用途                        |
| -------------------------- | --------------------------- |
| `app/journal.tsx`          | 网站主要页面和操作逻辑      |
| `app/globals.css`          | 页面外观、主题与手机布局    |
| `app/api/entries/route.ts` | 保存、读取和修改生活记录    |
| `app/api/moods/route.ts`   | 每日心情评分                |
| `app/api/media/route.ts`   | 私人照片和视频              |
| `app/api/chat/route.ts`    | AI 聊天，只在服务端使用密钥 |
| `db/schema.ts`             | 数据库结构                  |
| `drizzle/`                 | 数据库版本变更              |
| `.openai/hosting.json`     | Sites 托管配置              |

HTML 决定结构，CSS 决定外观，TypeScript 决定交互；本项目用 React 将这些组合成可复用页面。

## 本地运行

需要 Node.js 22.13 或更新版本。

```sh
npm ci
npm run build
```

首次运行或增加数据库迁移后，将未执行过的 SQL 文件按顺序应用到本地数据库：

```sh
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_gorgeous_karen_page.sql
```

在项目本地 `.env.local` 配置 `OPENAI_API_KEY`（可选 `OPENAI_MODEL`，默认 `gpt-6-luna`），随后运行：

```sh
node --env-file=.env.local scripts/run-framework.mjs dev --hostname 127.0.0.1
```

没有配置密钥时，也可以 `npm run dev` 使用记录、心情和定制功能。聊天界面会明确提示服务未配置，不会伪造 AI 回复。

打开终端打印的本地地址，用页面的「开启我的空间」进入模拟账号。请勿提交 `.env.local`、任何密钥或本地数据库，仓库已配置忽略规则。

## 托管与费用

网站包含服务端身份、数据库、文件存储和 AI 聊天，不能直接以 GitHub Pages 静态网站承载全部功能。GitHub 用于源码开源；当前在线版本使用 Sites 的 Worker、D1、R2 和认证。

自行创建新的 Sites 项目时，应替换 `.openai/hosting.json` 中的项目标识，并配置自己的数据库、文件存储与服务端密钥。不要复用原项目的身份信息。生产环境的 `OPENAI_API_KEY` 必须作为服务端 secret 配置，不能写进源码或浏览器环境变量。

AI API、存储与托管的可用性、额度及费用取决于各自服务。当前每日 50 次限制用于约束聊天调用，不是全站费用上限。心情评分只是个人回顾工具。

## 当前边界

这是首个可运行版本，暂不包含站内相互关注、公开日记、共享相册、推送通知、精灵图片生成和视频转码。没有回收站列表，删除操作可在当前会话中撤销。聊天历史只加载最近 60 条。附件未提供一键打包导出。

## 开源许可

本项目自编写的代码采用 MIT License。保留的 Sites starter、依赖及第三方脚本遵循其各自的许可证。
