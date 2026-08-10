/**
 * GET /img?u=<图片地址>
 * Cloudflare Pages Function：图片代理（绕过微信防盗链 + CORS，供 canvas 导出）
 */
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

const ALLOWED_IMAGE_HOSTS = new Set(['mmbiz.qpic.cn', 'mmbiz.qlogo.cn']);
const ALLOWED_IMAGE_TYPES = new Set([
  'image/avif',
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

export function isAllowedImageUrl(url) {
  return url.protocol === 'https:'
    && ALLOWED_IMAGE_HOSTS.has(url.hostname)
    && !url.port
    && !url.username
    && !url.password;
}

export async function onRequestGet({ request, fetcher = fetch }) {
  const u = new URL(request.url).searchParams.get('u');
  if (!u) return new Response('missing u', { status: 400 });
  let target;
  try {
    target = new URL(u);
  } catch {
    return new Response('bad url', { status: 400 });
  }
  if (!isAllowedImageUrl(target)) return new Response('forbidden image host', { status: 403 });

  let resp;
  try {
    resp = await fetcher(target.href, {
      headers: { 'User-Agent': UA, Referer: 'https://mp.weixin.qq.com/' },
      cf: { cacheTtl: 86400, cacheEverything: true },
      redirect: 'error',
    });
  } catch {
    return new Response('', {
      status: 502,
      headers: { 'X-Content-Type-Options': 'nosniff' },
    });
  }
  if (!resp.ok) return new Response('', { status: resp.status });

  const contentType = resp.headers.get('content-type') || '';
  const mediaType = contentType.split(';', 1)[0].trim().toLowerCase();
  if (!ALLOWED_IMAGE_TYPES.has(mediaType)) {
    return new Response('', {
      status: 415,
      headers: { 'X-Content-Type-Options': 'nosniff' },
    });
  }

  const headers = new Headers({
    'Content-Type': contentType,
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=86400',
    'X-Content-Type-Options': 'nosniff',
  });
  return new Response(resp.body, { status: 200, headers });
}
