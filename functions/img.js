/**
 * GET /img?u=<图片地址>
 * Cloudflare Pages Function：图片代理（绕过微信防盗链 + CORS，供 canvas 导出）
 */
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

export async function onRequestGet({ request }) {
  const u = new URL(request.url).searchParams.get('u');
  if (!u) return new Response('missing u', { status: 400 });
  let target;
  try {
    target = new URL(u);
  } catch {
    return new Response('bad url', { status: 400 });
  }
  if (!/^https?:$/.test(target.protocol)) return new Response('bad protocol', { status: 400 });

  const resp = await fetch(target.href, {
    headers: { 'User-Agent': UA, Referer: 'https://mp.weixin.qq.com/' },
    cf: { cacheTtl: 86400, cacheEverything: true },
  });
  if (!resp.ok) return new Response('', { status: resp.status });

  const headers = new Headers({
    'Content-Type': resp.headers.get('content-type') || 'image/jpeg',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=86400',
  });
  return new Response(resp.body, { status: 200, headers });
}
