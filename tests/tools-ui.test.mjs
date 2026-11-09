import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const toolPaths = ['xhs', 'gzh', 'aiwei', 'jinci', 'html', 'mermaid', 'video-gif', 'all-recorder'];
const buildSourcePaths = [
  'index.html',
  'skill/index.html',
  'tools/index.html',
  'tools/editorial.css',
  ...['xhs', 'gzh', 'aiwei', 'jinci', 'html', 'mermaid', 'video-gif', 'all-recorder', 'tianqi'].map((path) => `tools/${path}/index.html`)
];

test('tools center lists eight tools with one launch date', () => {
  const html = read('tools/index.html');
  for (const path of toolPaths) assert.match(html, new RegExp(`href=["']/tools/${path}/["']`));
  assert.equal((html.match(/2026\.07\.10/g) || []).length, 8);
  assert.match(html, /href=["']\/tools\/editorial\.css["']/);
});

test('homepage greets as 空格 and orders the four public sections', () => {
  const html = read('index.html');
  assert.match(html, /你好，我是\s*空格/);
  assert.doesNotMatch(html, /可以叫我/);
  assert.doesNotMatch(html, /小红书 2/);
  assert.match(html, /https:\/\/x\.com\/kongge_space/);
  const headings = [...html.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi)].map((match) => match[1].replace(/<[^>]+>/g, '').trim());
  assert.deepEqual(headings, ['我的产品', '与我合作', '我的工具', '在别处找到我']);
  const elsewhere = html.match(/<section\b[^>]*id=["']elsewhere["'][^>]*>([\s\S]*?)<\/section>/i);
  assert.ok(elsewhere, 'missing elsewhere section');
  const items = elsewhere[1].match(/<li\b/gi) || [];
  const icons = elsewhere[1].match(/<svg\b/gi) || [];
  assert.equal(icons.length, items.length);
});

test('build copies catalog and shared stylesheet', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.match(pkg.scripts.build, /cp tools\/index\.html dist\/tools\/index\.html/);
  assert.match(pkg.scripts.build, /cp tools\/editorial\.css dist\/tools\/editorial\.css/);
});

test('every build copy source exists', () => {
  for (const path of buildSourcePaths) {
    assert.ok(existsSync(new URL('../' + path, import.meta.url)), path);
  }
});

test('xhs uses Editorial Console shell and stable controls', () => {
  const html = read('tools/xhs/index.html');
  for (const token of ['/tools/editorial.css', 'ec-topbar', 'ec-identity', 'ec-workspace', 'aria-live="polite"', 'id="go"', 'id="dl-all"']) assert.ok(html.includes(token), token);
  assert.doesNotMatch(html, /示例：第一行/);
});
