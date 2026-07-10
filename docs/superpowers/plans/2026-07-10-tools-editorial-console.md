# Tools Editorial Console Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a unified Editorial Console interface for seven tools, add an eight-card tools center, and replace the homepage Tools dropdown with a direct catalog link.

**Architecture:** Keep each tool as a standalone static HTML application and preserve its existing domain logic. Add one shared `tools/editorial.css` file for the product shell, controls, workspace panels, focus states, and responsive behavior; each tool retains only domain-specific CSS in its HTML. Add a Node built-in test file that asserts navigation, dates, required shell structure, stable control IDs, and the all-recorder exclusion.

**Tech Stack:** Static HTML/CSS/JavaScript, Node.js built-in test runner, existing CDN libraries, Cloudflare Pages/Wrangler.

## Global Constraints

- Redesign only `xhs`, `gzh`, `aiwei`, `jinci`, `html`, `mermaid`, and `video-gif`.
- Do not change the interface of `tools/all-recorder/index.html`.
- Use white/off-white surfaces, black text, and `#1267d6` as the primary action color.
- Tool names appear at the top-left beside a back link to `/tools/`; the top-bar center remains empty.
- Cards and workspace panels use a maximum `6px` radius.
- Remove tutorial paragraphs and repeated instructions; keep limits, errors, progress, and required disclaimers.
- Keep existing control IDs, parsing, rendering, export, copy, download, and local-processing logic unless a task explicitly changes an interaction.
- Every tools-center launch date is exactly `2026.07.10`.
- Two-column workspaces collapse below `860px` without horizontal overflow.
- Do not add a frontend framework or runtime package.

---

## File Map

- Create `tools/editorial.css`: shared shell, buttons, segmented controls, panels, status, focus, responsive, and reduced-motion rules.
- Create `tools/index.html`: eight-card tools catalog.
- Create `tests/tools-ui.test.mjs`: structural regression tests using `node:test`, `assert`, and `fs`.
- Modify `index.html`: direct Tools link; remove dropdown markup, CSS, and JavaScript.
- Modify `package.json`: copy `tools/index.html` and `tools/editorial.css` into `dist/tools/`.
- Modify the seven tool HTML files: new shell and task-specific workspace composition while preserving domain logic.
- Do not modify `tools/all-recorder/index.html`.

### Task 1: Shared Editorial Shell, Tools Center, Homepage Navigation

**Files:**
- Create: `tools/editorial.css`
- Create: `tools/index.html`
- Create: `tests/tools-ui.test.mjs`
- Modify: `index.html`
- Modify: `package.json`

**Interfaces:**
- Produces: `.ec-shell`, `.ec-topbar`, `.ec-identity`, `.ec-actions`, `.ec-workspace`, `.ec-panel`, `.ec-button`, `.ec-segmented`, `.ec-status`, and `.ec-card-grid` CSS contracts.
- Produces: `/tools/` catalog route and shared `/tools/editorial.css` asset.
- Consumes: the eight existing tool URLs.

- [ ] **Step 1: Write failing catalog and navigation tests**

Create `tests/tools-ui.test.mjs` with:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const toolPaths = ['xhs', 'gzh', 'aiwei', 'jinci', 'html', 'mermaid', 'video-gif', 'all-recorder'];

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
```

- [ ] **Step 2: Run tests and verify the red state**

Run: `node --test tests/tools-ui.test.mjs`

Expected: failures for missing `tools/index.html`, direct homepage link, and build copy commands.

- [ ] **Step 3: Implement shared CSS and tools center**

Create `tools/editorial.css` with these exact core tokens and contracts, followed by responsive rules:

```css
:root {
  --ec-paper: #f5f5f2;
  --ec-surface: #ffffff;
  --ec-ink: #111111;
  --ec-muted: #6f6f69;
  --ec-faint: #9b9b94;
  --ec-line: #deded8;
  --ec-blue: #1267d6;
  --ec-blue-dark: #0b4fa9;
  --ec-danger: #c9352b;
  --ec-success: #147a51;
  --ec-sans: "Avenir Next", Avenir, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
  --ec-mono: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
}
.ec-shell { min-height: 100vh; background: var(--ec-paper); color: var(--ec-ink); font-family: var(--ec-sans); }
.ec-topbar { min-height: 58px; display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 10px 24px; border-bottom: 1px solid var(--ec-line); background: rgba(255,255,255,.96); }
.ec-identity { display: inline-flex; align-items: center; gap: 12px; min-width: 0; color: var(--ec-ink); text-decoration: none; font-weight: 700; }
.ec-back { display: grid; place-items: center; width: 32px; height: 32px; border: 1px solid var(--ec-line); border-radius: 50%; }
.ec-actions { display: flex; align-items: center; justify-content: flex-end; gap: 8px; flex-wrap: wrap; }
.ec-main { width: min(1440px, 100%); margin: 0 auto; padding: 22px 24px 40px; }
.ec-workspace { display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: 14px; align-items: stretch; }
.ec-panel { min-width: 0; overflow: hidden; border: 1px solid var(--ec-line); border-radius: 6px; background: var(--ec-surface); }
.ec-panel-head { min-height: 42px; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 8px 14px; border-bottom: 1px solid var(--ec-line); font: 700 11px/1 var(--ec-mono); color: var(--ec-muted); text-transform: uppercase; }
.ec-button { min-height: 36px; padding: 0 14px; border: 1px solid var(--ec-line); border-radius: 4px; background: var(--ec-surface); color: var(--ec-ink); font-weight: 650; cursor: pointer; }
.ec-button--primary { border-color: var(--ec-blue); background: var(--ec-blue); color: #fff; }
.ec-button:focus-visible, .ec-card:focus-visible { outline: 3px solid rgba(18,103,214,.24); outline-offset: 2px; }
.ec-status { min-height: 20px; color: var(--ec-muted); font-size: 12px; }
@media (max-width: 860px) { .ec-workspace { grid-template-columns: 1fr; } .ec-topbar { align-items: flex-start; flex-direction: column; } .ec-actions { width: 100%; justify-content: flex-start; } }
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { scroll-behavior: auto !important; transition-duration: .01ms !important; animation-duration: .01ms !important; } }
```

Build `tools/index.html` with eight full-card links in the specified order. Use `aria-label="工具列表"`, visible arrow characters, one concise outcome sentence per card, and exactly one `2026.07.10` per card.

In `index.html`, replace the complete `<span class="tools-menu">...</span>` block with:

```html
<a href="/tools/">Tools</a>
```

Delete `.tools-menu`, `.tools-trigger`, `.tools-panel`, `.tools-item`, `.tools-name`, `.tools-desc`, `.tools-date` CSS and the dropdown click/outside-click JavaScript.

Extend `package.json` build script so it creates `dist/tools` and copies both new files before copying tool directories.

- [ ] **Step 4: Run catalog tests and production build**

Run: `node --test tests/tools-ui.test.mjs && npm run build`

Expected: 3 tests pass; build exits `0`; `dist/tools/index.html` and `dist/tools/editorial.css` exist.

- [ ] **Step 5: Commit the catalog slice**

```bash
git add tools/editorial.css tools/index.html tests/tools-ui.test.mjs index.html package.json
git commit -m "feat: add editorial tools center"
```

### Task 2: Redesign 公众号转小红书

**Files:**
- Modify: `tests/tools-ui.test.mjs`
- Modify: `tools/xhs/index.html`

**Interfaces:**
- Consumes: Editorial CSS contracts from Task 1.
- Preserves: `#ta`, `#url`, `#go`, `#status`, `#grid`, `#dl-all`, `.tab`, `.theme-chip`, and download/render functions.

- [ ] **Step 1: Add the failing shell test**

Append:

```js
test('xhs uses Editorial Console shell and stable controls', () => {
  const html = read('tools/xhs/index.html');
  for (const token of ['/tools/editorial.css', 'ec-topbar', 'ec-identity', 'ec-workspace', 'aria-live="polite"', 'id="go"', 'id="dl-all"']) assert.ok(html.includes(token), token);
  assert.doesNotMatch(html, /示例：第一行/);
});
```

- [ ] **Step 2: Verify the new test fails**

Run: `node --test --test-name-pattern="xhs" tests/tools-ui.test.mjs`

Expected: fail because the old page has no Editorial shell.

- [ ] **Step 3: Recompose the XHS workspace**

Link `/tools/editorial.css`. Replace the page header with:

```html
<header class="ec-topbar">
  <a class="ec-identity" href="/tools/"><span class="ec-back" aria-hidden="true">←</span><span>公众号转小红书</span></a>
  <div class="ec-actions"><span class="ec-status" id="status" aria-live="polite"></span><button class="ec-button ec-button--primary" id="go">生成图文</button></div>
</header>
```

Use one `.ec-panel` input surface containing the existing text/URL segmented tabs and theme swatches. Place results below in an unframed section with `#result-bar` and `#grid`. Preserve all card-theme and 1080×1440 export CSS. Remove the permanent syntax hint. Keep validation errors in `#status`.

- [ ] **Step 4: Verify structure and workflow**

Run: `node --test --test-name-pattern="xhs" tests/tools-ui.test.mjs && npm run build`

Browser check: load `/tools/xhs/`, paste a three-section article, generate cards, switch all three themes, download one PNG, and confirm no console errors.

Expected: test passes; generated grid appears; existing export control IDs still work.

- [ ] **Step 5: Commit**

```bash
git add tests/tools-ui.test.mjs tools/xhs/index.html
git commit -m "feat: redesign xhs tool workspace"
```

### Task 3: Redesign 公众号排版

**Files:**
- Modify: `tests/tools-ui.test.mjs`
- Modify: `tools/gzh/index.html`

**Interfaces:**
- Consumes: Editorial CSS contracts.
- Preserves: `#md`, `#out`, `#copy-html`, `#copy-rich`, `.theme-chip`, theme tokens, Markdown rendering, and clipboard logic.

- [ ] **Step 1: Add the failing GZH test**

```js
test('gzh uses Editorial Console and concise panels', () => {
  const html = read('tools/gzh/index.html');
  for (const token of ['/tools/editorial.css', 'ec-topbar', 'ec-workspace', 'id="copy-rich"', 'id="copy-html"']) assert.ok(html.includes(token), token);
  assert.doesNotMatch(html, /语法：|点右上按钮复制后/);
});
```

- [ ] **Step 2: Verify failure**

Run: `node --test --test-name-pattern="gzh" tests/tools-ui.test.mjs`

Expected: fail on missing shell and retained tutorial copy.

- [ ] **Step 3: Implement editor/preview layout**

Add the shared stylesheet and top-left identity. Put `复制 HTML` and primary `复制到公众号` in `.ec-actions`. Keep the ten theme chips in a single horizontally scrollable swatch strip immediately above `.ec-workspace`. Label the panels only `MARKDOWN` and `PREVIEW`. Remove the syntax paragraph and tutorial header text. Preserve phone preview dimensions and all theme output styles.

- [ ] **Step 4: Verify rendering and clipboard states**

Run: `node --test --test-name-pattern="gzh" tests/tools-ui.test.mjs && npm run build`

Browser check: enter headings, quote, highlight, code, list, divider, and image Markdown; select each theme; trigger both copy actions; verify the preview updates without layout shift.

Expected: test and build pass; no console error; status feedback appears in the top bar.

- [ ] **Step 5: Commit**

```bash
git add tests/tools-ui.test.mjs tools/gzh/index.html
git commit -m "feat: redesign wechat formatter"
```

### Task 4: Redesign AI 味检测

**Files:**
- Modify: `tests/tools-ui.test.mjs`
- Modify: `tools/aiwei/index.html`

**Interfaces:**
- Consumes: Editorial CSS contracts.
- Preserves: `#ta`, `#go`, `#result`, `#score`, rule lists, highlighting, suggestions, and scoring.

- [ ] **Step 1: Add failing detector test**

```js
test('aiwei uses the shared analysis workspace', () => {
  const html = read('tools/aiwei/index.html');
  for (const token of ['/tools/editorial.css', 'ec-topbar', 'ec-workspace', 'ec-analysis-summary', 'id="go"', 'aria-live="polite"']) assert.ok(html.includes(token), token);
});
```

- [ ] **Step 2: Verify failure**

Run: `node --test --test-name-pattern="aiwei" tests/tools-ui.test.mjs`

Expected: fail on missing shared analysis structure.

- [ ] **Step 3: Implement editor/analysis layout**

Add the shared shell. Keep input controls in the left `.ec-panel`, with `检测 AI 味` in a stable footer inside that panel. Give the right panel an `.ec-analysis-summary` first row for score, verdict, and key counts, followed by the existing highlighted result and evidence list. Replace instructional empty copy with neutral zero-score placeholders. Add `aria-live="polite"` to status/result feedback without changing the scoring rules.

- [ ] **Step 4: Verify score and evidence flow**

Run: `node --test --test-name-pattern="aiwei" tests/tools-ui.test.mjs && npm run build`

Browser check: submit an empty input, a neutral paragraph, and text containing multiple existing AI phrases. Verify error, score, highlights, evidence list, and mobile stacking.

Expected: existing scores remain deterministic; no horizontal overflow at `390px`.

- [ ] **Step 5: Commit**

```bash
git add tests/tools-ui.test.mjs tools/aiwei/index.html
git commit -m "feat: redesign ai writing detector"
```

### Task 5: Redesign 违禁词检测

**Files:**
- Modify: `tests/tools-ui.test.mjs`
- Modify: `tools/jinci/index.html`

**Interfaces:**
- Consumes: Editorial CSS and the analysis layout established in Task 4.
- Preserves: `#ta`, `#go`, `#result`, platform `.pf` controls, dictionaries, scoring, highlighting, and suggestions.

- [ ] **Step 1: Add failing prohibited-word test**

```js
test('jinci uses platform segmentation and shared analysis layout', () => {
  const html = read('tools/jinci/index.html');
  for (const token of ['/tools/editorial.css', 'ec-topbar', 'ec-workspace', 'ec-segmented', 'ec-analysis-summary', 'id="go"']) assert.ok(html.includes(token), token);
  assert.match(html, /仅供发布前自查/);
});
```

- [ ] **Step 2: Verify failure**

Run: `node --test --test-name-pattern="jinci" tests/tools-ui.test.mjs`

Expected: fail because the old platform controls do not use the shared segmented contract.

- [ ] **Step 3: Implement the consistent detector workspace**

Add the shared shell. Convert the existing platform controls to `.ec-segmented` while retaining `.pf`, `data-pf`, and click behavior. Use the same left editor/footer action and right summary/evidence composition as AI 味检测. Shorten the visible disclaimer to `结果仅供发布前自查，最终规则以平台最新要求为准。` Preserve all platform dictionaries and risk calculations.

- [ ] **Step 4: Verify platforms and findings**

Run: `node --test --test-name-pattern="jinci" tests/tools-ui.test.mjs && npm run build`

Browser check: toggle 公众号、小红书、抖音 individually and in combination; detect text with known terms; verify selected styling, risk score, categories, and suggestions.

Expected: test/build pass and platform toggles keep their existing data behavior.

- [ ] **Step 5: Commit**

```bash
git add tests/tools-ui.test.mjs tools/jinci/index.html
git commit -m "feat: redesign prohibited words detector"
```

### Task 6: Redesign HTML 预览

**Files:**
- Modify: `tests/tools-ui.test.mjs`
- Modify: `tools/html/index.html`

**Interfaces:**
- Consumes: Editorial CSS contracts.
- Preserves: `#html`, `#preview`, `#sample`, `#copy`, `#clear`, Blob URL preview, clipboard behavior, and character count.

- [ ] **Step 1: Add failing HTML preview test**

```js
test('html preview uses a focused editor shell', () => {
  const html = read('tools/html/index.html');
  for (const token of ['/tools/editorial.css', 'ec-topbar', 'ec-editor-fill', 'id="preview"', 'id="sample"', 'id="copy"', 'id="clear"']) assert.ok(html.includes(token), token);
  assert.doesNotMatch(html, /如何使用/);
});
```

- [ ] **Step 2: Verify failure**

Run: `node --test --test-name-pattern="html preview" tests/tools-ui.test.mjs`

Expected: fail on missing focused editor shell.

- [ ] **Step 3: Implement full editor workspace**

Add shared shell with the tool name at top-left. Put `示例`, `复制`, `清空`, and primary `预览` in top-right actions, with Preview last. Wrap the existing textarea in one `.ec-panel.ec-editor-fill` that occupies the remaining viewport height. Keep character count in the panel header and status in `aria-live="polite"`. Remove permanent usage guidance; preserve popup-blocked and clipboard error feedback.

- [ ] **Step 4: Verify popup and clipboard behavior**

Run: `node --test --test-name-pattern="html preview" tests/tools-ui.test.mjs && npm run build`

Browser check: load sample, copy, clear, preview a full document, preview a fragment, and verify the new window renders each input.

Expected: Blob preview opens from the user click and the editor remains usable at desktop/mobile sizes.

- [ ] **Step 5: Commit**

```bash
git add tests/tools-ui.test.mjs tools/html/index.html
git commit -m "feat: redesign html preview editor"
```

### Task 7: Redesign Mermaid 预览器

**Files:**
- Modify: `tests/tools-ui.test.mjs`
- Modify: `tools/mermaid/index.html`

**Interfaces:**
- Consumes: Editorial CSS contracts.
- Preserves: `#code`, `#render`, `#copy-code`, `#copy-svg`, `#download-svg`, `#theme`, `#zoom`, `#samples`, and Mermaid render/download logic.
- Produces: `scheduleRender()` debounced render helper.

- [ ] **Step 1: Add failing Mermaid test**

```js
test('mermaid uses shared editor preview shell and debounced rendering', () => {
  const html = read('tools/mermaid/index.html');
  for (const token of ['/tools/editorial.css', 'ec-topbar', 'ec-workspace', 'id="render"', 'id="samples"', 'function scheduleRender']) assert.ok(html.includes(token), token);
});
```

- [ ] **Step 2: Verify failure**

Run: `node --test --test-name-pattern="mermaid" tests/tools-ui.test.mjs`

Expected: fail because `scheduleRender` does not exist.

- [ ] **Step 3: Implement editor/preview console and debounce**

Use the shared top bar with primary `渲染图表`, then copy-code, copy-SVG, and download-SVG secondary actions. Keep templates in a horizontally scrollable `.ec-segmented` row above the editor. Place theme and zoom in the preview panel header. Add:

```js
let renderTimer = 0;
function scheduleRender() {
  clearTimeout(renderTimer);
  renderTimer = setTimeout(renderDiagram, 450);
}
codeEl.addEventListener('input', () => {
  updateCount();
  setStatus('');
  scheduleRender();
});
```

Remove the previous input listener that tells the user to click render. Keep strict Mermaid security and render-sequence protection.

- [ ] **Step 4: Verify templates, themes, debounce, and export**

Run: `node --test --test-name-pattern="mermaid" tests/tools-ui.test.mjs && npm run build`

Browser check: select every template, edit valid code and wait for auto-render, enter invalid syntax, switch every theme, change zoom, copy code/SVG, and download SVG.

Expected: valid edits refresh after roughly `450ms`; syntax errors stay in the preview; no stale render replaces a newer edit.

- [ ] **Step 5: Commit**

```bash
git add tests/tools-ui.test.mjs tools/mermaid/index.html
git commit -m "feat: redesign mermaid preview console"
```

### Task 8: Redesign 视频转 GIF

**Files:**
- Modify: `tests/tools-ui.test.mjs`
- Modify: `tools/video-gif/index.html`

**Interfaces:**
- Consumes: Editorial CSS contracts.
- Preserves: upload/drop, `#start`, `#clip`, `#width`, `#fps`, `#target`, `#go`, `#frame`, `#reset`, `#download`, same-origin Worker Blob, retries, progress, and output metadata.

- [ ] **Step 1: Add failing media workspace test**

```js
test('video gif uses settings preview workspace and concise limits', () => {
  const html = read('tools/video-gif/index.html');
  for (const token of ['/tools/editorial.css', 'ec-topbar', 'ec-workspace', 'ec-settings-group', 'id="go"', 'id="download"']) assert.ok(html.includes(token), token);
  assert.doesNotMatch(html, /目标大小不是硬保证/);
  assert.match(html, /200MB/);
  assert.match(html, /10s/);
});
```

- [ ] **Step 2: Verify failure**

Run: `node --test --test-name-pattern="video gif" tests/tools-ui.test.mjs`

Expected: fail on old workspace and permanent explanatory paragraph.

- [ ] **Step 3: Implement settings/preview workspace**

Add shared shell. Put file limits as compact metadata in the upload panel header. Group `start` and `clip` inside `.ec-settings-group` labeled `CLIP`; group `width`, `fps`, and `target` inside a second group labeled `OUTPUT`. Put primary `生成 GIF`, preview frame, and reset in a stable action row. Keep progress directly below actions. Attach result metadata and `下载 GIF` to the preview footer. Remove the permanent target-size paragraph and show its limitation only when the generated result exceeds target.

- [ ] **Step 4: Verify conversion behavior**

Run: `node --test --test-name-pattern="video gif" tests/tools-ui.test.mjs && npm run build`

Browser check with a local short MP4: reject files over the configured limit using a mocked `File`, load metadata, adjust every control, preview a frame, generate a GIF, observe retry/progress state, and download the result.

Expected: existing Worker Blob avoids cross-origin worker errors; result and controls do not shift the page width.

- [ ] **Step 5: Commit**

```bash
git add tests/tools-ui.test.mjs tools/video-gif/index.html
git commit -m "feat: redesign video gif workspace"
```

### Task 9: Cross-Page Regression, Responsive Review, and Deployment

**Files:**
- Modify: `tests/tools-ui.test.mjs`
- Verify only: `tools/all-recorder/index.html`

**Interfaces:**
- Consumes: all routes and CSS contracts from Tasks 1-8.
- Produces: deployed catalog and redesigned tools on `kongge.space`.

- [ ] **Step 1: Add final exclusion and date assertions**

```js
test('all-recorder is listed but not redesigned', () => {
  const recorder = read('tools/all-recorder/index.html');
  assert.doesNotMatch(recorder, /\/tools\/editorial\.css|ec-topbar/);
  const catalog = read('tools/index.html');
  assert.match(catalog, /href=["']\/tools\/all-recorder\/["']/);
});

test('every redesigned tool links back to the catalog', () => {
  for (const path of toolPaths.filter((path) => path !== 'all-recorder')) {
    const html = read(`tools/${path}/index.html`);
    assert.match(html, /href=["']\/tools\/["']/, path);
  }
});
```

- [ ] **Step 2: Run the complete structural suite**

Run: `node --test tests/tools-ui.test.mjs`

Expected: all tests pass with zero failures.

- [ ] **Step 3: Run production and syntax verification**

Run:

```bash
npm run build
for f in tools/{xhs,gzh,aiwei,jinci,html,mermaid,video-gif}/index.html; do
  perl -0777 -ne 'while (/<script(?: type="module")?>(.*?)<\/script>/sg) { print $1 }' "$f" | node --check --input-type=module
done
```

Expected: build and all seven syntax checks exit `0`.

- [ ] **Step 4: Run browser regression at desktop and mobile**

Serve `dist` locally and use Playwright at `1440×900` and `390×844`.

Verify:

- `/tools/` contains eight cards and eight dates.
- Homepage Tools link navigates to `/tools/` with no dropdown panel.
- All seven top bars show the name at top-left and actions at right.
- Each primary workflow from Tasks 2-8 succeeds.
- No page has horizontal overflow, overlapping controls, uncaught page errors, or console errors.
- `all-recorder` matches its pre-redesign markup checksum from the start of implementation.

Expected: all route and workflow assertions pass at both viewports.

- [ ] **Step 5: Deploy and verify production**

Run:

```bash
npx wrangler pages deploy dist --project-name kong-space --branch main --commit-dirty=true
```

Then request `https://kongge.space/tools/`, the homepage, and all eight tool URLs with cache-busting query strings.

Expected: HTTP `200`; tools center contains eight `2026.07.10` dates; homepage contains direct `/tools/` link and no dropdown markup; all redesigned pages reference `/tools/editorial.css`.

- [ ] **Step 6: Commit final regression coverage**

```bash
git add tests/tools-ui.test.mjs
git commit -m "test: cover editorial tools rollout"
```
