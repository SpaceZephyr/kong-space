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

test('homepage Tools navigation is a direct link', () => {
  const html = read('index.html');
  assert.match(html, /<a href=["']\/tools\/["']>Tools<\/a>/);
  assert.doesNotMatch(html, /tools-panel|tools-trigger|tools-menu/);
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
