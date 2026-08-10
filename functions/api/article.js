/**
 * GET /api/article?url=<公众号文章链接>
 * Cloudflare Pages Function：抓取公众号文章，返回 { title, author, date, html }
 */
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

export function isAllowedArticleUrl(url) {
  return url.protocol === 'https:'
    && url.hostname === 'mp.weixin.qq.com'
    && !url.port
    && !url.username
    && !url.password;
}

function json(obj, code = 200) {
  return new Response(JSON.stringify(obj), {
    status: code,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

async function fetchArticle(url, fetcher) {
  const resp = await fetcher(url.href, {
    headers: { 'User-Agent': UA },
    redirect: 'error',
  });
  if (!resp.ok) throw new Error('抓取失败 HTTP ' + resp.status);
  const html = await resp.text();

  const pick = (re) => {
    const m = html.match(re);
    return m ? m[1].trim() : '';
  };

  let title =
    pick(/<meta\s+property="og:title"\s+content="([^"]*)"/i) ||
    pick(/<h1[^>]*class="rich_media_title"[^>]*>([\s\S]*?)<\/h1>/i) ||
    pick(/<title>([\s\S]*?)<\/title>/i);
  title = title.replace(/<[^>]+>/g, '').trim();

  const author =
    pick(/<meta\s+name="author"\s+content="([^"]*)"/i) ||
    pick(/id="js_name"[^>]*>([\s\S]*?)<\/a>/i).replace(/<[^>]+>/g, '').trim() ||
    pick(/var\s+nickname\s*=\s*(?:htmlDecode\()?"([^"]*)"/i);

  const date =
    pick(/var\s+createTime\s*=\s*'([^']*)'/i) ||
    pick(/id="publish_time"[^>]*>([\s\S]*?)<\/em>/i).replace(/<[^>]+>/g, '').trim();

  // 正文：<div id="js_content">，括号匹配 div 深度
  let body = '';
  const start = html.search(/<div[^>]*id="js_content"[^>]*>/i);
  if (start >= 0) {
    const open = html.indexOf('>', start) + 1;
    let depth = 1;
    const re = /<\/?div\b[^>]*>/gi;
    re.lastIndex = open;
    let m;
    while ((m = re.exec(html))) {
      depth += m[0][1] === '/' ? -1 : 1;
      if (depth === 0) {
        body = html.slice(open, m.index);
        break;
      }
    }
  } else {
    const a = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
    body = a ? a[1] : '';
  }

  body = body
    .replace(/<img([^>]*?)\bdata-src=/gi, '<img$1 src=')
    .replace(/\ssrc="(https?:\/\/[^"]+)"/gi, (_, src) => ` src="/img?u=${encodeURIComponent(src)}"`)
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '');

  return { title, author, date, html: body };
}

export async function onRequestGet({ request, fetcher = fetch }) {
  const rawTarget = new URL(request.url).searchParams.get('url');
  if (!rawTarget) return json({ error: '缺少 url 参数' }, 400);

  let target;
  try {
    target = new URL(rawTarget);
  } catch {
    return json({ error: '无效的文章链接' }, 400);
  }
  if (!isAllowedArticleUrl(target)) {
    return json({ error: '仅支持 mp.weixin.qq.com 的 HTTPS 文章链接' }, 403);
  }

  try {
    const data = await fetchArticle(target, fetcher);
    if (!data.html) return json({ error: '未能解析出正文，试试直接粘贴文章内容' }, 422);
    return json(data);
  } catch {
    return json({ error: '文章抓取失败，请确认链接有效后重试' }, 502);
  }
}
