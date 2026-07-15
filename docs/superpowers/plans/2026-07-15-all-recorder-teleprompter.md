# 万物皆可录提词器 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为“万物皆可录”增加不会进入导出视频的自动滚动提词器，以及保留麦克风的摄像头开关。

**Architecture:** 保持单文件静态工具结构。提词器作为 `stage` 外的 HUD 独立渲染，Canvas 仍只捕获 `stage`；媒体状态拆分为音频轨道和视频轨道，录制流始终从 Canvas 获取视频，并按可用性附加麦克风轨道。

**Tech Stack:** HTML、CSS、原生 JavaScript、MediaDevices、MediaRecorder、Canvas、html2canvas、Playwright 浏览器回归测试。

## Global Constraints

- 提词器、脚本和控制按钮不得进入导出视频。
- 关闭摄像头后麦克风继续录音。
- 摄像头关闭时仍允许开始录制。
- 提词器支持编辑、收起、关闭、手动滚动和慢/中/快三档自动滚动。
- 不增加服务器依赖或持久化后端。

---

### Task 1: 解耦摄像头和麦克风媒体状态

**Files:**
- Modify: `tools/all-recorder/index.html`

**Interfaces:**
- Produces: `ensureMicrophone(): Promise<boolean>`、`enableCamera(): Promise<boolean>`、`disableCamera(): void`、`releaseMedia(): void`。
- Produces: `microphoneStream` 仅持有音频轨道，`cameraStream` 仅持有视频轨道。

- [ ] **Step 1: 建立可观察的媒体状态**

将单一 `cameraStream` 拆为：

```js
let microphoneStream = null;
let cameraStream = null;
let cameraVideo = null;
```

- [ ] **Step 2: 实现独立权限申请与释放**

```js
async function ensureMicrophone() {
  if (microphoneStream?.getAudioTracks().some((track) => track.readyState === 'live')) return true;
  microphoneStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: AUDIO_CONSTRAINTS });
  return true;
}

async function enableCamera() {
  cameraStream = await navigator.mediaDevices.getUserMedia({ video: VIDEO_CONSTRAINTS, audio: false });
  return true;
}

function disableCamera() {
  cameraStream?.getVideoTracks().forEach((track) => track.stop());
  cameraStream = null;
  cameraVideo = null;
}
```

- [ ] **Step 3: 允许无摄像头录制**

把录制前置条件改为 `contentReady`，并在开始录制时附加可用音频：

```js
microphoneStream?.getAudioTracks()
  .filter((track) => track.readyState === 'live')
  .forEach((track) => canvasStream.addTrack(track));
```

- [ ] **Step 4: 验证媒体状态切换**

使用 Playwright 注入模拟 `getUserMedia`，预期：关闭摄像头后 `#cameraBox` 隐藏、`#recordBtn` 可用、音频轨道未调用 `stop()`。

- [ ] **Step 5: 提交媒体重构**

```bash
git add tools/all-recorder/index.html
git commit -m "feat: decouple recorder camera and microphone"
```

### Task 2: 增加隔离式提词器

**Files:**
- Modify: `tools/all-recorder/index.html`

**Interfaces:**
- Consumes: `stage` 仍是唯一 Canvas 捕获根节点。
- Produces: `setPrompterOpen(open: boolean)`、`setPrompterMode(mode: 'edit' | 'read')`、`startPromptScroll()`、`stopPromptScroll()`。

- [ ] **Step 1: 添加入口和 HUD 面板**

在录制按钮后增加：

```html
<button class="control-btn" id="scriptBtn" type="button">口播脚本</button>
```

面板放在 `stage` 外，并标记：

```html
<aside class="teleprompter" id="teleprompter" data-html2canvas-ignore="true" hidden></aside>
```

- [ ] **Step 2: 添加编辑与阅读模式**

编辑模式使用 `textarea#scriptInput`；阅读模式使用可手动滚动的 `div#scriptReader`。点击“开始提词”同步脚本文本并切换阅读模式。

- [ ] **Step 3: 实现三档自动滚动**

```js
const PROMPT_SPEEDS = { slow: 18, medium: 32, fast: 52 };

function runPromptFrame(time) {
  const delta = Math.min(48, time - promptLastFrame);
  scriptReader.scrollTop += PROMPT_SPEEDS[promptSpeed] * delta / 1000;
  if (scriptReader.scrollTop + scriptReader.clientHeight >= scriptReader.scrollHeight - 1) stopPromptScroll();
  else promptFrame = requestAnimationFrame(runPromptFrame);
}
```

- [ ] **Step 4: 完成响应式和无障碍状态**

桌面宽度约 `360px`、最大高度 `62vh`；移动端位于底部控制区上方、最大高度 `48vh`。所有切换按钮更新 `aria-pressed`，关闭面板时停止自动滚动但保留脚本。

- [ ] **Step 5: 浏览器验证隔离**

检查提词器不在 `#stage` 内，`#stage [data-html2canvas-ignore]` 不包含脚本内容；打开面板后页面无横向溢出。

- [ ] **Step 6: 提交提词器功能**

```bash
git add tools/all-recorder/index.html
git commit -m "feat: add recorder teleprompter"
```

### Task 3: 端到端回归、部署与线上验证

**Files:**
- Modify: `tools/all-recorder/index.html` only if regression fixes are required.

**Interfaces:**
- Consumes: Task 1 and Task 2 completed UI and media functions。
- Produces: production deployment on `kongge.space/tools/all-recorder/`。

- [ ] **Step 1: 构建静态站点**

Run: `npm run build`

Expected: command exits `0` and `dist/tools/all-recorder/index.html` contains `teleprompter` and `disableCamera`.

- [ ] **Step 2: 运行桌面与移动回归**

用 Playwright 验证：脚本编辑、阅读、三档速度、播放/暂停、面板关闭、摄像头开关、关闭摄像头后录制按钮可用、无横向溢出、无 `pageerror`。

- [ ] **Step 3: 验证真实 Canvas 隔离边界**

断言：

```js
await page.evaluate(() => !document.querySelector('#stage').contains(document.querySelector('#teleprompter')))
```

Expected: `true`。

- [ ] **Step 4: 推送与部署**

```bash
git push origin main
npm run deploy
```

- [ ] **Step 5: 检查正式域名**

访问 `https://kongge.space/tools/all-recorder/`，预期返回 `200`，页面包含“口播脚本”，且线上浏览器回归无控制台异常。
