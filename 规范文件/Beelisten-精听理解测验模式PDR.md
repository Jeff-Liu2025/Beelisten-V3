# Beelisten 精听理解测验模式 — 产品需求文档 (PDR)

> 版本: v1.0 | 日期: 2026-04-22 | 状态: 草案待评审

---

## 1. 功能概述

### 1.1 一句话描述
用户听完一句英文后，从 4 个中文翻译选项中选出正确的一个，训练"听音理解"能力。

### 1.2 核心价值
| 现有模式的问题 | 精听理解测验如何解决 |
|----------------|---------------------|
| 词块填空偏"拼写/阅读"，不用真听 | 必须听懂才能选对，倒逼耳朵发力 |
| 没有理解层面的检验 | 直接考察"这句话你听懂了吗" |
| 练习方式单一，容易倦怠 | 选择题形式轻松，有游戏感 |

### 1.3 目标用户
- 已有基础词汇量（高考 90~110 分）的大学生
- 能听清单词但连成句子就跟不上的用户
- 想要"快速验证自己听没听懂"的用户

---

## 2. 核心玩法设计

### 2.1 完整流程

```
┌─────────────────────────────────────────────────┐
│  🐝 精听理解测验                                  │
│                                                   │
│  第 3 / 18 句                                     │
│                                                   │
│  [▶️ 播放本句]   🔊 已播放 1 次                    │
│                                                   │
│  ──── 请选择这句话的意思 ────                      │
│                                                   │
│  ┌──────────────────────────────────────────┐    │
│  │  A. 我小时候每天都走路去上学               │    │
│  └──────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────┐    │
│  │  B. 我年轻时经常跑步锻炼身体               │    │ ← 干扰项
│  └──────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────┐    │
│  │  C. 我过去每天骑车送孩子上学               │    │ ← 干扰项
│  └──────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────┐    │
│  │  D. 我年轻时梦想有一辆自行车上学           │    │ ← 干扰项
│  └──────────────────────────────────────────┘    │
│                                                   │
│  [🔄 再听一遍]                                    │
└─────────────────────────────────────────────────┘

          👇 用户选择后

┌─────────────────────────────────────────────────┐
│  ✅ 回答正确！                                    │
│                                                   │
│  原文: "I used to walk to school every day        │
│         when I was young."                        │
│                                                   │
│  翻译: 我小时候每天都走路去上学。                   │
│                                                   │
│  [下一句 →]                                       │
└─────────────────────────────────────────────────┘

  或

┌─────────────────────────────────────────────────┐
│  ❌ 回答错误                                      │
│                                                   │
│  你选的: B. 我年轻时经常跑步锻炼身体                │
│  正确的: A. 我小时候每天都走路去上学                │
│                                                   │
│  原文: "I used to walk to school every day        │
│         when I was young."                        │
│                                                   │
│  [🔄 再听一遍]  [下一句 →]                        │
└─────────────────────────────────────────────────┘
```

### 2.2 交互状态流转

```
                    ┌─────────┐
                    │  等待播放  │
                    └────┬────┘
                         │ 点击播放 / 自动播放
                         ▼
                    ┌─────────┐
                    │  播放中   │ ← 显示当前句子序号
                    └────┬────┘
                         │ 播放完毕自动暂停
                         ▼
                    ┌─────────┐
         ┌────────│  选择答案  │────────┐
         │        └─────────┘        │
         │ 选对                       │ 选错
         ▼                            ▼
    ┌─────────┐                 ┌─────────┐
    │  ✅ 正确  │                 │  ❌ 错误  │
    └────┬────┘                 └────┬────┘
         │                           │
         │    ┌──────────────┐       │
         └───→│  显示原文+翻译 │←──────┘
              └──────┬───────┘
                     │ 点击下一句
                     ▼
              ┌─────────────┐
              │ 下一句等待播放 │
              └─────────────┘
```

### 2.3 重听机制

| 条件 | 行为 |
|------|------|
| 播放完一句 | 自动暂停，显示 4 个选项 |
| 选择前 | 可无限次点击"再听一遍" |
| 选错后 | 可再听一遍，然后进入下一句 |
| 选对后 | 显示原文确认，直接进入下一句 |
| 全部完成 | 显示本次测验结果摘要 |

---

## 3. 选项生成方案

### 3.1 核心难点

4 个选项中，1 个正确翻译 + 3 个干扰项。干扰项质量决定体验好坏。

### 3.2 方案：LLM API 实时生成

**工作原理**：将英文字幕句子发给 LLM，一次性返回 4 个选项（含正确答案标记）。

**Prompt 模板**：
```
你是一个英语听力考试的出题专家。请根据以下英文句子，生成4个中文翻译选项，其中只有1个是正确的。

要求：
1. 正确翻译要准确、自然
2. 干扰项要有迷惑性，利用以下策略：
   - 替换关键动词/名词（如 walk→run, school→work）
   - 改变时态或语态（如 过去时→现在时）
   - 增加或减少否定（如 加上"不"、去掉"没"）
   - 替换相似场景（如 上学→上班, 走路→骑车）
3. 4个选项长度相近，不要让正确答案明显更长或更短
4. 随机打乱选项顺序

英文句子: "{sentence}"

请以 JSON 格式返回：
{
  "options": [
    {"text": "翻译内容", "correct": true/false},
    {"text": "翻译内容", "correct": true/false},
    {"text": "翻译内容", "correct": true/false},
    {"text": "翻译内容", "correct": true/false}
  ]
}
```

### 3.3 API 配置

**使用平台**：DeepSeek

| 配置项 | 值 |
|--------|-----|
| API 地址 | `https://api.deepseek.com/v1/chat/completions` |
| 模型 | `deepseek-chat`（DeepSeek-V3） |
| 请求格式 | OpenAI 兼容格式 |
| API Key | 存储在项目 `js/config.js`（已加入 .gitignore） |

**单次请求示例**：
```js
const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`
  },
  body: JSON.stringify({
    model: 'deepseek-chat',
    messages: [
      { role: 'system', content: '你是一个英语听力考试出题专家...' },
      { role: 'user', content: `请为以下英文句子生成4个中文翻译选项：\n"${sentence}"` }
    ],
    temperature: 0.8,
    max_tokens: 500,
    response_format: { type: 'json_object' }
  })
});
```

**费用估算**：

| 项目 | 数值 |
|------|------|
| 每题消耗 | ~500 tokens |
| 14 个内置资源总句数 | ~1120 句 |
| 全部生成一次花费 | ¥1~2 |
| 缓存后重复使用 | ¥0 |

### 3.4 缓存策略

为了避免每次使用都调 API（费用 + 延迟），采用本地缓存：

```
用户听到某句
    │
    ▼
本地缓存有该句的选项？ ──是──→ 直接使用
    │否
    ▼
调 DeepSeek API 生成
    │
    ▼
存入 localStorage 缓存
    │
    ▼
展示选项
```

**缓存结构**：
```js
// localStorage key: "beelisten-quiz-cache"
{
  "storycorps-001": {           // 资源ID
    "3": {                      // 句子序号
      "sentence": "I used to walk to school...",
      "options": [
        {"text": "我小时候每天都走路去上学", "correct": true},
        {"text": "我年轻时经常跑步锻炼身体", "correct": false},
        {"text": "我过去每天骑车送孩子上学", "correct": false},
        {"text": "我年轻时梦想有一辆自行车上学", "correct": false}
      ],
      "generatedAt": "2026-04-22T18:00:00"
    }
  }
}
```

### 3.5 预生成脚本（Phase 2）

未来可写 Python 脚本，把 14 个内置资源的所有句子一次性生成并保存为 JSON 文件，用户使用时零 API 调用。

---

## 4. 结果摘要页

全部句子做完后，展示本次练习结果：

```
┌─────────────────────────────────────┐
│  🐝 本次精听测验结果                  │
│                                      │
│  ✅ 正确: 12 / 18                    │
│  ❌ 错误: 6                          │
│  📊 正确率: 67%                      │
│                                      │
│  ──── 错题回顾 ────                  │
│                                      │
│  ❌ 第3句                            │
│  原文: "I used to walk to school..." │
│  你选: B. 我年轻时经常跑步锻炼身体     │
│  正确: A. 我小时候每天都走路去上学     │
│                                      │
│  ❌ 第7句                            │
│  原文: "She decided to pursue..."    │
│  你选: C. ...                        │
│  正确: B. ...                        │
│                                      │
│  [🔄 重做错题]  [返回列表]            │
└─────────────────────────────────────┘
```

---

## 5. UI 设计规范

### 5.1 配色

| 元素 | 颜色 | 说明 |
|------|------|------|
| 选项卡片默认 | `var(--card-bg)` | 蜜蜂风格卡片色 |
| 选项卡片 hover | `var(--primary-light)` | 淡黄高亮 |
| 选中-正确 | `#4CAF50` 绿色 | 配合 ✅ 图标 |
| 选中-错误 | `#F44336` 红色 | 配合 ❌ 图标 |
| 正确答案标记 | `#4CAF50` 绿色边框 | 错误时高亮正确项 |

### 5.2 选项卡片样式

- 圆角卡片，左侧字母标识（A/B/C/D）
- hover 时轻微上移 + 阴影加深
- 选中后禁用其他选项的点击
- 过渡动画 0.2s ease

### 5.3 进度指示

- 顶部显示 "第 X / N 句"
- 可选：进度条显示整体进度

---

## 6. 技术实现方案

### 6.1 新增文件

| 文件 | 职责 |
|------|------|
| `js/config.js` | API 配置（Key、地址、模型）— **已加入 .gitignore** |
| `js/config.example.js` | 配置模板（不含真实 Key） |
| `js/training/quiz-listen.js` | 精听测验核心逻辑（播放控制、选项展示、判题、结果汇总） |
| `js/training/quiz-generator.js` | 选项生成器（调 API、缓存管理） |
| `css/training-quiz.css` | 精听测验样式 |

### 6.2 修改文件

| 文件 | 修改内容 |
|------|---------|
| `js/subtitle/index.js` | 新增方法：获取指定序号的单句字幕（startTime, endTime, text） |
| `js/player/index.js` | 新增方法：播放指定时间段（startTime → endTime）后自动暂停 |
| `.gitignore` | 添加 `js/config.js` 防止 Key 泄露 |

### 6.3 核心模块设计

**config.js**：
```js
// ⚠️ 此文件包含 API Key，已加入 .gitignore，不会被上传到 GitHub
export const API_CONFIG = {
  provider: 'deepseek',
  apiKey: 'sk-xxxx...',       // 你的真实 Key
  model: 'deepseek-chat',
  baseUrl: 'https://api.deepseek.com/v1'
};
```

**config.example.js**：
```js
// 复制此文件为 config.js，填入你的 API Key
export const API_CONFIG = {
  provider: 'deepseek',
  apiKey: 'your-api-key-here',
  model: 'deepseek-chat',
  baseUrl: 'https://api.deepseek.com/v1'
};
```

**quiz-listen.js**：
```js
// 主要职责：
// 1. 控制单句播放（播完自动暂停）
// 2. 调用 quiz-generator 获取选项
// 3. 渲染选项卡片 UI
// 4. 处理用户选择 → 判断对错 → 显示反馈
// 5. 管理答题进度（当前第几句、对错记录）
// 6. 全部完成后展示结果摘要

// 对外事件：
document.dispatchEvent(new CustomEvent('quiz-start', { detail: { resourceId } }));
document.dispatchEvent(new CustomEvent('quiz-answer', { detail: { sentenceIndex, correct } }));
document.dispatchEvent(new CustomEvent('quiz-complete', { detail: { total, correct, wrongList } }));
```

**quiz-generator.js**：
```js
// 主要职责：
// 1. 检查 localStorage 缓存
// 2. 缓存未命中时调 DeepSeek API
// 3. 解析 API 返回的 JSON
// 4. 存入缓存
// 5. 返回选项列表

async function generateOptions(sentence, resourceId, sentenceIndex) {
  // 1. 查缓存
  const cached = getCachedOptions(resourceId, sentenceIndex);
  if (cached) return cached;
  
  // 2. 调 DeepSeek API
  const result = await callDeepSeekAPI(sentence);
  
  // 3. 存缓存
  saveToCache(resourceId, sentenceIndex, result);
  
  // 4. 返回
  return result;
}
```

### 6.4 事件通信

本模块与其他模块的通信方式（遵循项目开发规范）：

| 事件名 | 方向 | 携带数据 |
|--------|------|---------|
| `quiz-play-sentence` | quiz-listen → player | `{ startTime, endTime }` |
| `quiz-sentence-ended` | player → quiz-listen | `{ currentTime }` |
| `quiz-subtitle-request` | quiz-listen → subtitle | `{ resourceId }` |
| `quiz-subtitle-data` | subtitle → quiz-listen | `{ sentences: [...] }` |
| `quiz-answer` | quiz-listen → 外部 | `{ sentenceIndex, correct, total, correctCount }` |
| `quiz-complete` | quiz-listen → 外部 | `{ total, correct, wrongList }` |

---

## 7. 数据统计

### 7.1 记录数据结构

```js
// localStorage key: "beelisten-quiz-stats"
{
  "storycorps-001": {
    "history": [
      {
        "date": "2026-04-22",
        "total": 18,
        "correct": 12,
        "wrongSentences": [3, 7, 10, 14, 15, 17],
        "duration": 480  // 秒
      }
    ],
    "bestAccuracy": 0.67,
    "totalPlays": 1
  }
}
```

### 7.2 统计用途
- 个人档案页展示精听练习记录
- 错题重练功能的数据来源
- 连续学习天数计算

---

## 8. 边界情况处理

| 场景 | 处理方式 |
|------|---------|
| 句子太短（<3 个单词） | 跳过该句，不生成选项 |
| API 调用失败 | 显示"选项生成失败"，提供"重试"按钮，同时提供"跳过此句" |
| API 返回格式错误 | try-catch 解析，失败则重试一次，仍失败则跳过 |
| 网络断开 | 优先使用缓存；无缓存时提示"需要网络连接" |
| 字幕数据缺失 | 显示提示"该资源暂不支持精听测验" |
| 用户中途退出 | 自动保存进度，下次可继续 |

---

## 9. 开发分阶段计划

### Phase 1：核心功能（本次开发）

| 步骤 | 内容 | 依赖 |
|------|------|------|
| 1 | 创建 `config.js` + `config.example.js` | 无 |
| 2 | 实现 `quiz-generator.js`（DeepSeek API 调用 + 缓存） | config.js |
| 3 | 实现 `quiz-listen.js`（播放控制 + 选项UI + 判题） | quiz-generator, player, subtitle |
| 4 | 编写 `training-quiz.css` 样式 | 无 |
| 5 | 联调测试 | 全部 |

### Phase 2：体验优化

- 预生成内置资源的选项 JSON
- 错题重练功能
- 答题计时（每句用了多久）
- 键盘快捷键（1234 选择选项）

### Phase 3：进阶功能

- 难度分级（简单：干扰项差异大；困难：干扰项极相似）
- 连续答题 streak 奖励蜂蜜
- 与蜂蜜商店联动

---

## 10. 风险评估

| 风险 | 等级 | 缓解方案 |
|------|:----:|:---------|
| LLM 生成的干扰项不够有迷惑性 | 中 | 优化 prompt；人工抽检质量 |
| API Key 前端暴露 | 中 | config.js 加入 .gitignore；Phase 2 考虑后端代理 |
| API 调用延迟影响体验 | 低 | 本地缓存 + 加载动画提示 |
| API 费用超预期 | 低 | DeepSeek 极便宜；预生成可消除后续费用 |
| 选项格式解析失败 | 低 | try-catch + 重试 + 跳过降级 |

---

_本 PDR 由 Beelisten 精听测验模式讨论产出，供开发参考。_
