# Tools Editorial Console Design

Date: 2026-07-10
Status: Approved for implementation planning

## Objective

Unify the public tools on `kongge.space` into one Editorial Console product language. Improve the visual hierarchy and task flow of seven tools while preserving their existing functional behavior. Replace the homepage Tools dropdown with a direct link to a dedicated tools center.

The redesign covers:

- `/tools/xhs/`
- `/tools/gzh/`
- `/tools/aiwei/`
- `/tools/jinci/`
- `/tools/html/`
- `/tools/mermaid/`
- `/tools/video-gif/`
- New `/tools/` tools center
- Homepage Tools navigation

`/tools/all-recorder/` is listed in the tools center but its interface is not redesigned.

## Product Principles

1. Reduce instructional copy. Let hierarchy, control placement, empty states, loading states, and results communicate the next action.
2. Keep one obvious primary action per task state.
3. Preserve local-first behavior and current output formats.
4. Keep dense workspaces calm and scannable rather than turning them into landing pages.
5. Use the same product shell without forcing every tool into an identical internal layout.

## Visual Direction

The selected direction is **Editorial Console**:

- White and off-white working surfaces
- Black primary typography
- Electric blue for primary actions and focus states
- Thin neutral borders and restrained shadows
- Maximum card radius of 6px, except controls that are naturally circular
- No gradients, decorative blobs, oversized marketing sections, or nested cards
- Editorial typography with `Avenir Next` / `PingFang SC` for the interface and `SFMono-Regular` for metadata and code
- Motion limited to short state transitions, focus changes, and result entrance

## Shared Tool Shell

Every redesigned tool uses a compact top bar:

- Top-left: back arrow to `/tools/` followed by the tool name
- Center: intentionally empty
- Top-right: only actions relevant to the current task state
- The tool name is never centered
- On mobile, the top bar wraps actions below the tool identity when necessary

Below the top bar, each tool uses one of two workspace patterns:

1. **Editor / Result** for writing, checking, HTML, and Mermaid tools.
2. **Settings / Preview** for media generation tools.

Panel headers use short labels such as `INPUT`, `RESULT`, `PREVIEW`, and `SETTINGS`. They do not contain tutorial sentences.

## Tools Center

Create `/tools/index.html` as the canonical tools catalog.

- Header links back to the homepage and identifies the page as `Tools`.
- Desktop uses a two-column card grid; mobile uses one column.
- All eight tools appear as individual cards.
- Each card contains: index number, category, tool name, one concise outcome statement, launch date, and an arrow.
- Every launch date is `2026.07.10`.
- Cards use full-card links with visible focus states.
- The page stays compact enough that the next card row is visible in the first viewport.

Card order:

1. 公众号转小红书
2. 公众号排版
3. AI 味检测
4. 违禁词检测
5. HTML 预览
6. Mermaid 预览器
7. 视频转 GIF
8. 万物皆可录

## Homepage Navigation

- Replace the current Tools dropdown trigger and panel with a normal `Tools` link to `/tools/`.
- Remove dropdown-only CSS and JavaScript.
- Do not expose individual tool links from the homepage navigation.

## Tool Interaction Designs

### 1. 公众号转小红书

- Use a compact segmented control for `粘贴内容 / 文章链接` at the top of the input panel.
- Keep the editor as the dominant first surface.
- Place the three visual themes as color swatches beside the primary `生成图文` action.
- Show generation progress in the action area rather than as permanent helper text.
- After generation, reveal a result header with card count and `全部下载`.
- Keep each generated image and its single-image download action together.
- Remove syntax examples from the permanent layout; rely on the input placeholder and validation state.

### 2. 公众号排版

- Keep the Markdown editor and phone preview side by side.
- Move theme selection into a compact swatch strip above the workspace.
- Keep `复制到公众号` as the primary top-right action.
- Keep `复制 HTML` as a secondary action.
- Remove the tutorial sentence from the preview panel header and remove the long syntax paragraph below the workspace.
- Preserve real-time preview and copy behavior.

### 3. AI 味检测

- Use a balanced Editor / Analysis split.
- Place the primary detect action at the bottom edge of the input panel so it remains close to the text.
- Use the right panel's first viewport for score, verdict, and key counts.
- Display matched phrases below the summary in a clean evidence list.
- Use color only for severity and highlighted evidence.
- Empty state uses a visual score placeholder instead of instructional paragraphs.

### 4. 违禁词检测

- Reuse the AI detection workspace structure for consistency.
- Put platform selection in a segmented control above the editor.
- Keep `开始检测` as the single primary action.
- Place risk score, counts, and grouped findings in the right panel.
- Preserve the legal disclaimer because it communicates a necessary limitation, but shorten its presentation.

### 5. HTML 预览

- Make the HTML editor fill the main workspace.
- Place `预览` as the primary top-right action.
- Present `示例`, `复制`, and `清空` as compact secondary controls.
- Keep the character count in the editor header.
- Remove the large instructional paragraph; retain only security/error feedback when preview creation fails.
- Preserve Blob URL rendering in a new window and revoke object URLs safely.

### 6. Mermaid 预览器

- Keep the code editor left and SVG canvas right.
- Present diagram templates as a compact horizontal type selector above the editor.
- Keep theme and zoom controls in the preview header.
- Use `渲染` as the primary action, with copy and download actions grouped beside it.
- Add a short debounce so valid edits refresh without repeated manual clicks; manual render remains available.
- Keep syntax errors close to the preview rather than in a separate instructional area.

### 7. 视频转 GIF

- Use Settings / Preview layout.
- Keep upload as the first state; after loading, compress file metadata into one row.
- Group clip controls together and output controls together.
- Keep target size visible because it drives the conversion behavior.
- Make `生成 GIF` the primary action; preview-frame and reset remain secondary.
- Show conversion progress as a clear inline progress strip and update the primary action state.
- Replace the permanent explanation paragraph with a compact target-size limitation note shown only when relevant.
- Keep result metadata and download action attached to the preview result.

## Content Rules

Remove:

- Repeated descriptions already implied by the tool name
- Tutorial sentences in panel headers
- Long syntax guides under workspaces
- Permanent messages such as `选择后开始` when the empty state already communicates this
- Visible keyboard shortcut instructions

Keep:

- File size and duration limits
- Security or browser compatibility failures
- Required legal disclaimers
- Validation errors and conversion/render progress
- Successful copy, render, generation, and download feedback

## State Model

Each tool supports four visual states:

1. Empty: neutral workspace with a clear input affordance.
2. Ready: primary action enabled after valid input.
3. Working: primary action disabled or converted to progress; duplicate actions prevented.
4. Result/Error: result appears in place; errors are attached to the failing surface.

Status updates should not resize the workspace or move primary controls.

## Responsive Behavior

- Two-column workspaces collapse to one column below 860px.
- Tool actions remain reachable without horizontal overflow.
- Fixed-format previews retain stable aspect ratios.
- Long labels wrap; controls do not shrink below usable dimensions.
- Tool cards become one column and preserve full-card tap targets.

## Accessibility

- Maintain semantic buttons, labels, and navigation landmarks.
- Add visible keyboard focus states.
- Use `aria-live` for meaningful status changes.
- Do not rely on color alone for selected, success, or error states.
- Respect `prefers-reduced-motion`.

## Implementation Boundaries

- Keep every tool as a deployable static HTML file.
- Do not introduce a framework or build-time CSS dependency.
- Shared visual tokens may be duplicated into each single-file tool to preserve standalone behavior.
- Preserve existing APIs, CDN dependencies, parsing logic, export logic, and local processing.
- Update the build script to copy `/tools/index.html` in addition to all tool directories.

## Verification

1. Run the production build.
2. Check JavaScript syntax for all modified HTML scripts.
3. Use browser automation at desktop and mobile widths for the tools center and all seven redesigned tools.
4. Exercise each primary workflow with representative input.
5. Confirm no horizontal overflow, control overlap, or console errors.
6. Deploy to Cloudflare Pages.
7. Verify `/tools/`, all eight tool URLs, and the homepage navigation on `kongge.space`.
