# 公众号文章 → 小红书图文

线上地址：https://kongge.space/tools/xhs/

把公众号文章（粘贴内容或链接）自动排版成 3:4（1080×1440）小红书图文卡片，平铺预览，支持单张 PNG 与批量 ZIP 下载。

## 部署形态（Cloudflare Pages）

- 前端：`tools/xhs/index.html`（构建时拷入 `dist/tools/xhs/`）
- 后端：Pages Functions
  - `functions/api/article.js` → `GET /api/article?url=` 抓取公众号文章
  - `functions/img.js` → `GET /img?u=` 图片代理（绕微信防盗链 + CORS，供 canvas 导出）

```bash
npm run dev      # wrangler pages dev dist（需 Node 22+，本机可用 /opt/homebrew/opt/node/bin）
npm run deploy   # 构建并发布到 kong-space 项目
```

`server.local.js` 是等价的零依赖 Node 版后端（node server.local.js，端口 3900），仅作本地备用。

## 功能

- 两种输入：粘贴正文（第一行=标题，`#` 行=小标题，`>` 行=引用），或直接贴 `mp.weixin.qq.com` 链接
- 三套风格：Notion / Apple / Claude（基于 getdesign.md 品牌 DESIGN.md token）
- 自动分页：封面卡 + 按段落/句子分页，标题防孤行，超高图片限高或独占一页
- 导出：单张 1080×1440 PNG，或全部打包 ZIP
