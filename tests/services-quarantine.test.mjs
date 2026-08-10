import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('reported services URL is quarantined with no interactive content', async () => {
  const { onRequest } = await import('../functions/services/index.js');
  const response = await onRequest();
  const body = await response.text();

  assert.equal(response.status, 410);
  assert.equal(response.headers.get('content-type'), 'text/plain; charset=utf-8');
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(response.headers.get('x-frame-options'), 'DENY');
  assert.equal(
    response.headers.get('content-security-policy'),
    "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
  );
  assert.match(body, /removed pending security review/i);
  assert.doesNotMatch(body, /<\s*(?:a|form|input|button|script|iframe)\b/i);
  assert.doesNotMatch(body, /https?:|mailto:|javascript:/i);
});

test('nested services paths use the same quarantine response', async () => {
  const { onRequest } = await import('../functions/services/[[path]].js');
  const response = await onRequest();

  assert.equal(response.status, 410);
  assert.equal(await response.text(), 'This page has been removed pending security review.\n');
});

test('static services fallback contains only the quarantine notice', async () => {
  const html = await readFile(new URL('../services/index.html', import.meta.url), 'utf8');

  assert.match(html, /removed pending security review/i);
  assert.match(html, /content-security-policy/i);
  assert.doesNotMatch(html, /xiaobot|mailto:|wzfh520|data-copy-wechat/i);
  assert.doesNotMatch(html, /<\s*(?:form|input|button|iframe)\b/i);
  assert.doesNotMatch(html, /https?:\/\//i);
});
