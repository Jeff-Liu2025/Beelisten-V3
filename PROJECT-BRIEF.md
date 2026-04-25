# Beelisten v2.1 — 项目速览

> 本文档供任何新接入的 AI 快速了解项目。开发者：东莞理工学院环境工程大一学生。

***

## 1. 项目是什么

**Beelisten** 是一个英语听力自学网站，用蜜蜂主题（黄黑配色）。核心功能是播放 StoryCorps 等英语音频，同步显示双语字幕，支持划词查字典、词块填空练习。

## 2. 技术栈

- 纯前端：HTML5 + CSS3 + 原生 JavaScript（ES6+ 模块化）
- 无框架，无后端，无构建工具
- 数据存储：localStorage（用户进度、蜂蜜币）
- API：DeepSeek（AI对话、后续可能用于生成题目）
- 音频：HTML5 Audio
- 字幕：SRT / LRC 格式

## 3. 项目结构

```
Beelisten-v2.1/
├── index.html              # 主播放器页
├── learn.html              # 学习页
├── word-fill-select.html   # 词块填空选择页
├── word-fill-training.html # 词块填空练习页
├── css/
│   ├── main.css
│   ├── player.css
│   ├── subtitles.css
│   └── word-fill.css
├── js/
│   ├── main.js             # 入口
│   ├── store/index.js      # 状态管理（Map + CustomEvent）
│   ├── player/index.js     # 音频播放器
│   ├── subtitle/index.js   # 字幕同步高亮
│   ├── dictionary/index.js # 划词查字典
│   ├── training/
│   │   └── word-fill.js    # 词块填空（目前唯一训练模式）
│   ├── utils/
│   │   ├── srtParser.js    # SRT/LRC/VTT 解析
│   │   └── time.js         # 时间格式化
│   └── podcasts-data.js    # 音频资源列表
├── data/                   # 音频 + 字幕文件（14个资源）
└── 规范文件/               # PRD、UI设计指南等
```

## 4. 核心架构

### 状态管理（Store）

```js
// js/store/index.js
// 集中式状态，通过 CustomEvent 通知变化
Store.set('key', value);
Store.get('key');
Store.subscribe('key-changed', callback);
```

### 事件通信

```js
// 模块间通过 CustomEvent 通信，不直接调用
document.dispatchEvent(new CustomEvent('subtitle-click', { detail: { startTime, index } }));
document.addEventListener('player-timeupdate', (e) => { ... });
```

### 关键数据结构

```js
// 字幕条目
{ startTime: 11.22, endTime: 15.60, content: "英文", translation: "中文" }

// 音频资源
{ id: "storycorps-xxx", title: "...", audio: "data/xxx.mp3", srt: "data/xxx.srt" }
```

## 5. 已知问题

- **Edge 浏览器**：Tracking Prevention 可能阻止 `audio.currentTime` 设置，换 Firefox 可解决
- **v2.1 是可靠版本**，v2 有路径拼写错误（`htlm/`）

##

## 7. 设计规范

- 蜜蜂主题：主色 `#FFC107`（黄），辅色 `#1A1A1A`（黑），背景 `#F5F5F5`
- CSS 变量统一：`var(--primary)`, `var(--bg-card)` 等
- 模块化：每个功能一个文件，单一职责

## 8. 如何运行

```bash
cd C:/Users/123/Desktop/Beelisten-v2.1
npx http-server -p 8080
# 然后用 Firefox 打开 http://localhost:8080
```

***

_最后更新：2026-04-24_
