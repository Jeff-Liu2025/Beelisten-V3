# Beelisten 项目开发规范（AI 助手专用）

请你在协助开发 Beelisten 英语听力网站时，严格遵守以下规范。这些规则旨在保证代码的可维护性、可扩展性，避免出现之前项目中遇到的耦合混乱问题。

---

## 1. 模块化与解耦

- **单一职责**：每个模块（播放器、字幕、查词、练习）应有独立的文件和清晰的职责，只做自己分内的事。
- **禁止直接调用**：模块之间不得直接调用对方的函数或修改对方的 DOM。必须通过**自定义事件**进行通信。
- **避免全局变量**：严禁使用 `window` 全局变量传递数据。使用模块局部变量或事件传递数据。

---

## 2. 文件结构

项目结构应清晰明了，推荐如下组织方式：

```
Beelisten-v2/
├── index.html
├── css/
│   ├── style.css          # 全局样式
│   ├── player.css         # 播放器专用样式
│   └── podcast.css        # 播客页面样式
├── js/
│   ├── main.js            # 入口文件，初始化各模块
│   ├── player/            # 播放器模块
│   │   └── index.js       # 播放器初始化、事件绑定
│   ├── subtitle/          # 字幕模块
│   │   └── index.js       # 字幕解析、渲染、高亮
│   ├── dictionary/        # 查词模块
│   │   └── index.js       # 双击查词、API调用
│   ├── training/          # 练习模块
│   │   └── word-fill.js   # 词汇拖块练习
│   └── utils/             # 工具函数
│       ├── time.js        # 时间格式化
│       └── srtParser.js   # SRT解析
├── data/                  # 听力资源（音频、字幕）
└── assets/                # 图片、图标
```

---

## 3. 命名规范

- **变量/函数**：使用 camelCase，如 `playPauseBtn`、`loadSubtitles()`。
- **CSS 类名**：使用 kebab-case，如 `progress-bar`、`subtitle-item`。
- **事件名称**：使用 kebab-case，如 `subtitle-click`、`player-ready`。
- **常量**：使用大写字母 + 下划线，如 `MAX_SPEED = 2.0`。

---

## 4. 代码风格

- 使用 ES6+ 语法，包括 `import/export`、箭头函数、模板字符串等。
- 每个函数应有简短注释，说明其作用、参数和返回值。
- 函数长度不宜超过 30 行，过长的函数应拆分为多个小函数。
- 避免嵌套过深，可使用 `async/await` 处理异步。

---

## 5. 事件通信

模块间通信必须通过自定义事件，禁止直接调用其他模块的函数。

**发送事件**：
```javascript
document.dispatchEvent(new CustomEvent('subtitle-click', {
    detail: { startTime: 12.5 }
}));
```

**监听事件**：
```javascript
document.addEventListener('subtitle-click', (e) => {
    const startTime = e.detail.startTime;
    // 处理跳转
});
```

常用事件举例：
- `subtitle-click`：点击字幕行，携带 `startTime`。
- `player-timeupdate`：播放时间更新，携带 `currentTime`。
- `subtitles-loaded`：字幕加载完成，携带 `subtitles` 数据。

---

## 6. 状态管理

- 共享状态（如当前字幕列表、播放状态）应集中管理，建议使用一个简单的 **Store 模块**。
- Store 提供 getter/setter，并在状态变化时触发事件，供其他模块监听更新。

示例 Store (`js/store/index.js`)：
```javascript
const state = {
    subtitles: [],
    currentTime: 0,
    isPlaying: false
};

const listeners = {};

export function get(key) { return state[key]; }
export function set(key, value) {
    state[key] = value;
    document.dispatchEvent(new CustomEvent(`state-${key}-changed`, { detail: value }));
}
```

---

## 7. 避免重复代码

- 通用工具函数（时间格式化、SRT 解析）必须放在 `js/utils/` 下，供各模块复用。
- 不要在不同模块中复制粘贴相同逻辑。

---

## 8. AI 协作规则

当用户请求你生成或修改代码时，请遵循：

1. **先理解需求**：如果描述不清晰，可以请用户提供更多细节或示例。
2. **一次只改一个模块**：尽量不跨多个文件同时修改，除非必须。
3. **提供实现计划**：对于复杂功能，先给出简要计划，用户确认后再写代码。
4. **代码注释**：生成代码时必须包含关键注释，解释逻辑。
5. **测试提醒**：生成后提醒用户测试功能，确保不破坏现有功能。
6. **遵循本规范**：所有生成的代码必须符合上述规范，尤其是模块化和事件通信。

---

## 9. 版本控制提醒

- 每次重要改动后，提醒用户使用 Git 提交，例如：
  `git add . && git commit -m "feat: 添加词汇拖块练习"`
- 对于重大重构，建议用户先备份当前版本。

---

## 10. 错误处理与调试

- 代码中应包含适当的 `try...catch` 和错误日志（`console.error`）。
- 如果发现 bug，先请用户提供控制台报错信息，再协助定位。

---

请你在后续开发中严格遵守以上规范，这将帮助我们构建一个稳定、易维护的 Beelisten 网站。如有疑问，可随时向用户提问。
