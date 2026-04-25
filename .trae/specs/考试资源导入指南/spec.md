# 考试资源导入指南 Spec

## Why
用户需要批量导入四六级考试听力资源，只需准备MP3音频、英文SRT字幕和MD格式答案，系统自动处理中文翻译和JSON生成，确保新导入的考试资源能够与现有功能完全兼容。

## What Changes
- 定义用户需准备的文件格式（MP3、英文SRT、MD答案）
- 定义MD格式答案文件规范
- 定义自动化处理流程（中文翻译、JSON生成）
- 定义数据配置格式

## Impact
- Affected specs: 考试资源管理、精听测验、词块填空、学习导航
- Affected code: `podcasts-data.js`, `data/quiz/*.json`, `听力资源/` 目录

---

## 考试资源导入完整指南

### 一、用户需准备的文件

#### 1.1 必需文件清单
| 文件类型 | 命名规范 | 存放目录 | 说明 |
|---------|---------|---------|------|
| 音频文件 | `{exam-type}_{year}_{month}_{set}.mp3` | `听力资源/` | MP3格式，建议比特率128kbps+ |
| 英文字幕 | `{exam-type}_{year}_{month}_{set}.srt` | `听力资源/` | SRT格式，包含完整听力原文 |
| 题目答案 | `{exam-type}-{year}-{month}-{set}_answers.md` | `听力资源/` | MD格式，包含题目和答案 |

#### 1.2 文件命名示例
```
CET-4 2025年6月第1套：
- cet4_2025_06_1.mp3          （用户准备）
- cet4_2025_06_1.srt          （用户准备）
- cet4-2025-06-1_answers.md   （用户准备）

系统自动生成：
- cet4_2025_06_1_中文.srt     （API翻译生成）
- cet4-2025-06-1_questions.json （从MD转换生成）
```

#### 1.3 命名规范说明
- **exam-type**: `cet4` (四级) 或 `cet6` (六级)
- **year**: 四位年份，如 `2025`
- **month**: 两位月份，如 `06` (6月) 或 `12` (12月)
- **set**: 套号，如 `1` (第1套) 或 `2` (第2套)

---

### 二、英文SRT字幕格式要求

#### 2.1 格式示例
```srt
1
00:00:00,560 --> 00:00:04,520
College english test band four part two

2
00:00:04,960 --> 00:00:07,080
listening comprehension 

3
00:00:07,630 --> 00:00:08,710
Section a 

4
00:00:09,270 --> 00:00:11,750
Directions , in this section 

...

14
00:00:41,380 --> 00:00:42,780
News report one 

...

55
00:02:40,600 --> 00:02:42,040
News report two
```

#### 2.2 关键标记要求（必须包含）
系统会自动检测以下标记进行分段，**SRT文件中必须包含这些标记**：

| 标记类型 | 必须出现 | 格式示例 |
|---------|---------|---------|
| Section | 是 | "Section a", "Section b", "Section c" |
| News Report | Section A中 | "News report one", "News report two", "News report three" |
| Conversation | Section B中 | "Conversation one", "Conversation two" |
| Passage | Section C中 | "Passage one", "Passage two", "Passage three" |

---

### 三、MD格式答案文件规范

#### 3.1 完整格式示例
```markdown
# CET-4 2025年6月听力真题 (第1套) 答案

## Section A - News Report 1

### Question 1
**Question**: What did the corn growers do to make their corn special?
**Options**:
- A. By slapping some butter on it.
- B. By enhancing its nourishment.
- C. By growing it in South Dakota.
- D. By cooking it in vegetable oil.
**Answer**: A

### Question 2
**Question**: Why did the corn growers go to the Corn Palace?
**Options**:
- A. To introduce their corn to tourists.
- B. To attend an honorary ceremony.
- C. To share experience with other corn growers.
- D. To exhibit their corn at the state's Corn Palace.
**Answer**: B

## Section A - News Report 2

### Question 3
**Question**: What did Jordan Jacks and Tarred Goodman do according to a news release?
**Options**:
- A. Stole mail several times.
- B. Forged postal keys illegally.
- C. Attacked postmen on multiple occasions.
- D. Broke a number of postal collection boxes.
**Answer**: A

### Question 4
**Question**: What do Jordan Jack's and Troid Goodman face?
**Options**:
- A. A sentence for life.
- B. Loss of all their possessions.
- C. Twenty-three years' hard labor.
- D. Up to fifteen years in prison.
**Answer**: D

## Section A - News Report 3

### Question 5
**Question**: Why has the clothing industry come under attack?
**Options**:
- A. It escapes regulation and misleads consumers.
- B. It ignores economically feasible recycling options.
- C. It creates waste and severely impacts the environment.
- D. It produces clothes affordable only to a tiny minority.
**Answer**: C

...

## Section B - Conversation 1

### Question 8
**Question**: Why is the woman complaining?
**Options**:
- A. The city's rush-hour traffic is intolerable.
- B. She cannot avoid rush-hour traffic.
- C. The local government is inefficient.
- D. The city is too big to move around easily.
**Answer**: A

...

## Section C - Passage 1

### Question 16
**Question**: How did language come into being according to researchers?
**Options**:
- A. Through deliberation.
- B. Through evolution.
- C. Through invention.
- D. Through collaboration.
**Answer**: B

...
```

#### 3.2 MD格式规范说明

##### 文件结构
```
# 标题（资源名称）

## Section段落标题（如：Section A - News Report 1）

### Question N（题号）
**Question**: 题目内容
**Options**:
- A. 选项A
- B. 选项B
- C. 选项C
- D. 选项D
**Answer**: 正确答案（A/B/C/D）
```

##### 格式要点
1. **Section标题格式**：`## Section {A/B/C} - {News Report N/Conversation N/Passage N}`
2. **题号连续**：从1开始连续编号
3. **选项格式**：`- {A/B/C/D}. 选项内容`
4. **答案格式**：`**Answer**: {A/B/C/D}`

#### 3.3 段落与Section对应关系
| Section | 段落类型 | 题目数量 |
|---------|---------|---------|
| Section A | News Report 1-3 | 每篇2-3题，共7题 |
| Section B | Conversation 1-2 | 每篇4题，共8题 |
| Section C | Passage 1-3 | 每篇3-4题，共10题 |

---

### 四、自动化处理流程

#### 4.1 处理流程图
```
用户准备文件                    系统自动处理
    │
    ├─ MP3音频 ──────────────────► 直接使用
    │
    ├─ 英文SRT ──────────────────┬─► 分段检测
    │                           │
    │                           └─► API翻译生成中文SRT
    │
    └─ MD答案 ───────────────────┬─► 解析MD内容
                                │
                                ├─► 提取题目和选项
                                │
                                ├─► API翻译题目中文
                                │
                                └─► 生成JSON文件
```

#### 4.2 中文SRT翻译（API方式）

**推荐方式**：使用DeepSeek API批量翻译

**翻译Prompt模板**：
```
你是专业的英语翻译专家。请将以下SRT格式字幕翻译成中文。

【要求】
1. 保持SRT格式完全不变（序号、时间轴）
2. 只翻译文本内容，保持时间轴原样
3. 专业术语准确翻译
4. 语气自然流畅，符合中文表达习惯
5. 考试指导语部分保持简洁

【原文】
[Paste SRT content here]

【输出格式】
直接输出翻译后的SRT内容，不要添加任何解释。
```

**处理建议**：
- 按段落分批翻译，避免单次请求过长
- 合并相邻短句后翻译，保持上下文连贯
- 缓存翻译结果，避免重复调用API

#### 4.3 JSON文件生成（从MD转换）

**转换逻辑**：
1. 解析MD文件，提取Section和Question结构
2. 根据SRT文件获取每个段落的开始/结束时间
3. 调用API翻译题目为中文
4. 生成符合规范的JSON文件

**题目中文翻译Prompt**：
```
你是专业的英语翻译专家。请将以下英语听力题翻译成中文。

【题目】
{questionText}

【要求】
1. 准确传达题目含义
2. 使用简洁自然的中文表达
3. 保持疑问句格式

直接输出中文翻译，不要添加任何解释。
```

---

### 五、生成的JSON数据结构

#### 5.1 完整结构示例
```json
{
  "resourceId": "cet4-2025-06-1",
  "title": "CET-4 2025年6月听力真题 (第1套)",
  "passages": [
    {
      "passageId": "news-report-1",
      "passageName": "News Report 1",
      "section": "A",
      "passageStartTime": 41.0,
      "passageEndTime": 116.0,
      "questions": [
        {
          "questionNumber": 1,
          "questionText": "What did the corn growers do to make their corn special?",
          "questionTextZh": "种植玉米的人做了什么让他们的玉米变得特别？",
          "options": [
            { "label": "A", "text": "By slapping some butter on it.", "correct": true },
            { "label": "B", "text": "By enhancing its nourishment.", "correct": false },
            { "label": "C", "text": "By growing it in South Dakota.", "correct": false },
            { "label": "D", "text": "By cooking it in vegetable oil.", "correct": false }
          ],
          "correctAnswer": "A"
        }
      ]
    }
  ],
  "totalQuestions": 25,
  "generatedAt": "2025-04-24"
}
```

#### 5.2 时间戳获取规则
1. **passageStartTime**：段落标记出现后第一句原文的开始时间
   - News Report 1: "News report one" 字幕后第一句
   - Conversation 1: "Conversation one" 字幕后第一句
   
2. **passageEndTime**：段落最后一句原文的结束时间（不包含题目朗读时间）
   - 需要从SRT文件中定位"Questions X to Y are based on..."之前的最后一句

---

### 六、podcasts-data.js 配置

#### 6.1 考试资源配置示例
```javascript
{
    id: "cet4-2025-06-1",
    title: "CET-4 2025年6月听力真题 (第1套)",
    category: "exam",
    audioFile: "cet4_2025_06_1.mp3",
    subtitleFile: "cet4_2025_06_1.srt",
    subtitleFileZh: "cet4_2025_06_1_中文.srt",
    duration: "25:00",
    wordCount: 800,
    difficulty: "medium",
    description: "2025年6月大学英语四级听力真题第一套",
    questionsFile: "data/quiz/cet4-2025-06-1_questions.json"
}
```

---

### 七、导入流程步骤

#### 步骤1：准备文件
1. 准备MP3音频文件
2. 准备英文SRT字幕文件（确保包含Section/News Report/Conversation/Passage标记）
3. 准备MD格式答案文件

#### 步骤2：放置文件
将三个文件放入 `听力资源/` 目录

#### 步骤3：运行自动化处理
1. 系统检测新文件
2. 调用API翻译生成中文SRT
3. 解析MD生成JSON文件
4. 自动更新podcasts-data.js配置

#### 步骤4：功能测试
按照检查清单逐项测试各模块功能

---

### 八、功能适配检查清单

#### 8.1 学习导航
- [ ] 资源在首页学习列表中正确显示
- [ ] 点击资源卡片可以正常播放
- [ ] 字幕正常显示（英文/中文切换）
- [ ] 进度保存和恢复功能正常

#### 8.2 复习模块
- [ ] 资源在复习列表中正确显示
- [ ] 分类筛选功能正常（考试真题类别）
- [ ] 资源卡片信息完整（时长、词数、难度）

#### 8.3 词块填空
- [ ] 资源在词块填空选择页面显示
- [ ] 分段检测正确（Section A/B/C）
- [ ] 每个分段可以正常训练
- [ ] API生成选项功能正常
- [ ] 进度保存和恢复功能正常

#### 8.4 精听测验
- [ ] 资源在精听测验选择页面显示
- [ ] 分段列表正确显示
- [ ] 点击分段跳转到对应段落
- [ ] 音频播放到passageEndTime后暂停
- [ ] 题目正确显示
- [ ] 答题后显示正确/错误反馈
- [ ] 中文翻译正确显示
- [ ] 错题解析生成正常
- [ ] 段落完成后可进入下一段落
- [ ] 最终结果统计正确

---

### 九、常见问题

#### Q1: 分段检测不正确
**原因**：SRT文件中的标记格式不符合检测规则
**解决**：确保SRT文件包含正确的Section/News Report/Conversation/Passage标记

#### Q2: 题目不显示
**原因**：passageEndTime时间戳不准确
**解决**：检查SRT文件中段落结束位置，确保时间戳正确

#### Q3: 中文字幕翻译质量不佳
**原因**：API翻译可能存在误差
**解决**：可手动校对关键段落翻译，或调整翻译Prompt

#### Q4: MD格式解析失败
**原因**：MD文件格式不符合规范
**解决**：确保按照规范格式编写，Section标题和Question格式正确
