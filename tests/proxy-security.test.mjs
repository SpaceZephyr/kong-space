import test from 'node:test';
import assert from 'node:assert/strict';

import { isAllowedArticleUrl, onRequestGet as getArticle } from '../functions/api/article.js';
import { isAllowedImageUrl, onRequestGet as getImage } from '../functions/img.js';

test('article fetcher only accepts the official WeChat article origin', async () => {
  assert.equal(isAllowedArticleUrl(new URL('https://mp.weixin.qq.com/s/example')), true);
  assert.equal(isAllowedArticleUrl(new URL('http://mp.weixin.qq.com/s/example')), false);
  assert.equal(isAllowedArticleUrl(new URL('https://mp.weixin.qq.com:444/s/example')), false);
  assert.equal(isAllowedArticleUrl(new URL('https://mp.weixin.qq.com.evil.test/s/example')), false);
  assert.equal(isAllowedArticleUrl(new URL('https://example.com/article')), false);

  const response = await getArticle({
    request: new Request('https://kongge.space/api/article?url=https://example.com/article'),
  });
  assert.equal(response.status, 403);
});

test('image proxy only accepts HTTPS WeChat image origins', async () => {
  assert.equal(isAllowedImageUrl(new URL('https://mmbiz.qpic.cn/mmbiz_png/example/0')), true);
  assert.equal(isAllowedImageUrl(new URL('https://mmbiz.qlogo.cn/example')), true);
  assert.equal(isAllowedImageUrl(new URL('http://mmbiz.qpic.cn/example')), false);
  assert.equal(isAllowedImageUrl(new URL('https://mmbiz.qpic.cn:444/example')), false);
  assert.equal(isAllowedImageUrl(new URL('https://mmbiz.qpic.cn.evil.test/example')), false);
  assert.equal(isAllowedImageUrl(new URL('https://example.com/image.png')), false);

  const response = await getImage({
    request: new Request('https://kongge.space/img?u=https://example.com/image.png'),
  });
  assert.equal(response.status, 403);
});

test('image proxy refuses non-image upstream content', async () => {
  const response = await getImage({
    request: new Request('https://kongge.space/img?u=https://mmbiz.qpic.cn/example'),
    fetcher: async () => new Response('<html>not an image</html>', {
      headers: { 'Content-Type': 'text/html' },
    }),
  });

  assert.equal(response.status, 415);
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
});

test('image proxy refuses active SVG content', async () => {
  const response = await getImage({
    request: new Request('https://kongge.space/img?u=https://mmbiz.qpic.cn/example.svg'),
    fetcher: async () => new Response('<svg><script>alert(1)</script></svg>', {
      headers: { 'Content-Type': 'image/svg+xml' },
    }),
  });

  assert.equal(response.status, 415);
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
});

test('image proxy handles upstream network failures defensively', async () => {
  const response = await getImage({
    request: new Request('https://kongge.space/img?u=https://mmbiz.qpic.cn/example.png'),
    fetcher: async () => { throw new TypeError('network failure'); },
  });

  assert.equal(response.status, 502);
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
});

test('image proxy preserves valid images with defensive headers', async () => {
  const response = await getImage({
    request: new Request('https://kongge.space/img?u=https://mmbiz.qpic.cn/example'),
    fetcher: async () => new Response('image-bytes', {
      headers: { 'Content-Type': 'image/png' },
    }),
  });

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'image/png');
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
});
