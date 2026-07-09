#!/usr/bin/env node
/**
 * 公众号文章 → 小红书图文 工具 · 本地服务
 * 零依赖，Node 18+（内置 fetch）
 *
 *   node server.js          → http://localhost:3900
 *
 * 接口：
 *   GET /                 前端页面
 *   GET /api/article?url= 抓取公众号文章，返回 { title, author, date, html }
 *   GET /img?u=           图片代理（绕过防盗链 + 提供 CORS，供 canvas 导出）
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3900;
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

function json(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(obj));
}

async function fetchArticle(url) {
  const u = new URL(url);
  if (!/(^|\.)weixin\.qq\.com$/.test(u.hostname) && !/(^|\.)qq\.com$/.test(u.hostname)) {
    // 也允许其他文章页，尽力解析
  }
  const resp = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!resp.ok) throw new Error('抓取失败 HTTP ' + resp.status);
  const html = await resp.text();

  const pick = (re) => {
    const m = html.match(re);
    return m ? m[1].trim() : '';
  };

  // 标题
  let title =
    pick(/<meta\s+property="og:title"\s+content="([^"]*)"/i) ||
    pick(/<h1[^>]*class="rich_media_title"[^>]*>([\s\S]*?)<\/h1>/i) ||
    pick(/<title>([\s\S]*?)<\/title>/i);
  title = title.replace(/<[^>]+>/g, '').trim();

  // 作者 / 公众号名
  const author =
    pick(/<meta\s+name="author"\s+content="([^"]*)"/i) ||
    pick(/id="js_name"[^>]*>([\s\S]*?)<\/a>/i).replace(/<[^>]+>/g, '').trim() ||
    pick(/var\s+nickname\s*=\s*(?:htmlDecode\()?"([^"]*)"/i);

  // 日期
  const date =
    pick(/var\s+createTime\s*=\s*'([^']*)'/i) ||
    pick(/id="publish_time"[^>]*>([\s\S]*?)<\/em>/i).replace(/<[^>]+>/g, '').trim();

  // 正文：公众号在 <div id="js_content"> 内
  let body = '';
  const start = html.search(/<div[^>]*id="js_content"[^>]*>/i);
  if (start >= 0) {
    const open = html.indexOf('>', start) + 1;
    // 括号匹配 div 深度
    let depth = 1,
      i = open;
    const re = /<\/?div\b[^>]*>/gi;
    re.lastIndex = open;
    let m;
    while ((m = re.exec(html))) {
      depth += m[0][1] === '/' ? -1 : 1;
      if (depth === 0) {
        body = html.slice(open, m.index);
        break;
      }
      i = re.lastIndex;
    }
  } else {
    // 兜底：<article> 或 og:description
    const a = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
    body = a ? a[1] : '';
  }

  // 图片懒加载 data-src → src；并走本地代理
  body = body
    .replace(/<img([^>]*?)\bdata-src=/gi, '<img$1 src=')
    .replace(/\ssrc="(https?:\/\/[^"]+)"/gi, (_, src) => ` src="/img?u=${encodeURIComponent(src)}"`)
    // 去掉脚本样式
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '');

  return { title, author, date, html: body };
}

async function proxyImage(res, u) {
  const resp = await fetch(u, {
    headers: { 'User-Agent': UA, Referer: 'https://mp.weixin.qq.com/' },
  });
  if (!resp.ok) {
    res.writeHead(resp.status);
    return res.end();
  }
  const buf = Buffer.from(await resp.arrayBuffer());
  res.writeHead(200, {
    'Content-Type': resp.headers.get('content-type') || 'image/jpeg',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=86400',
  });
  res.end(buf);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  try {
    if (url.pathname === '/' || url.pathname === '/index.html') {
      const file = fs.readFileSync(path.join(__dirname, 'public', 'index.html'));
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(file);
    }
    if (url.pathname === '/api/article') {
      const target = url.searchParams.get('url');
      if (!target) return json(res, 400, { error: '缺少 url 参数' });
      const data = await fetchArticle(target);
      if (!data.html) return json(res, 422, { error: '未能解析出正文，试试直接粘贴文章内容' });
      return json(res, 200, data);
    }
    if (url.pathname === '/img') {
      const u = url.searchParams.get('u');
      if (!u) {
        res.writeHead(400);
        return res.end();
      }
      return await proxyImage(res, u);
    }
    res.writeHead(404);
    res.end('Not Found');
  } catch (e) {
    json(res, 500, { error: String(e.message || e) });
  }
});

server.listen(PORT, () => {
  console.log(`✅ 公众号 → 小红书 工具已启动: http://localhost:${PORT}`);
});
