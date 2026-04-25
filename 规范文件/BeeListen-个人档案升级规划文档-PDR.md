# BeeListen 个人档案页面增强 - PDR（产品需求文档）

> **文档版本**: v1.0  
> **创建日期**: 2026-04-03  
> **项目**: BeeListen v2 英语听力学习网站  
> **模块**: 个人档案（Profile Page）  

---

## 一、背景与目标

### 1.1 背景
当前个人档案页面已包含基础功能（用户信息卡片、统计概览、活跃度热图、时段分布图、等级系统、徽章系统、训练记录），但存在以下问题：
- profile.css 样式文件**缺失**（之前修复时添加了 HTML 但 CSS 未就位）
- 热图和图表参考了 TRAE IDE 的风格（GitHub 式活跃天数 + 日/夜弧线时段分布）
- 缺少更多激励性和趣味性的板块
- 页面整体视觉层次不够丰富

### 1.2 目标
打造一个**功能完整、视觉精美、具有蜜蜂品牌特色**的个人档案页面，作为用户的"学习成就展示中心"，提升用户粘性和学习动力。

### 1.3 参考设计
- TRAE IDE 个人档案页面的**活跃天数热图**（GitHub 风格，52周×7天格子）
- TRAE IDE 的**编程时段分布图**（日/月弧线 + 数据点 + 太阳/月亮图标）

---

## 二、整体架构

### 2.1 页面布局结构（从上到下）

```
┌─────────────────────────────────────────────┐
│  📋 个人档案 (页面标题)                       │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────────── 用户信息卡片 ────────────┐    │
│  │  [头像🐝]  BeeListener 学员          │    │
│  │            ID: 152****37             │    │
│  │            第 XX 天                  │    │
│  │  [#勤奋码神] [#单模型挚友] [#听力达人]│    │
│  └─────────────────────────────────────┘    │
│                                             │
│  ┌──── 学习统计概览 (4列) ────────────┐     │
│  │  📊总训练   ✅正确题  ⏱️时长  🎯正确率│     │
│  └─────────────────────────────────────┘    │
│                                             │
│  ┌──── 🔥 活跃天数热图 (GitHub风格) ──┐     │
│  │  Less ●●●●● More                     │     │
│  │  [52周 × 7天 格子矩阵]               │     │
│  └─────────────────────────────────────┘    │
│                                             │
│  ┌──── ⏰ 学习时段分布 (日/夜弧线) ───┐      │
│  │  ☀️ 12:00          🌙              │      │
│  │     ～～～曲线～～～                 │      │
│  │  06:00    18:00    24:00           │      │
│  └─────────────────────────────────────┘    │
│                                             │
│  ┌──── 🏆 成就与等级系统 ────────────┐      │
│  │  [等级进度条] 当前EXP / 下级EXP    │      │
│  │  [6个徽章：初次尝试/连续7天/...]   │      │
│  └─────────────────────────────────────┘    │
│                                             │
│  ┌──── 📊 学习数据看板 (新增) ────────┐     │
│  │  [本周vs上周 对比柱状图]            │     │
│  │  [词汇量增长趋势]                   │     │
│  │  [各训练模式占比 饼图]              │     │
│  └─────────────────────────────────────┘    │
│                                             │
│  ┌──── 🎯 本周目标追踪 (新增) ────────┐      │
│  │  [每日目标完成度 进度环]             │      │
│  │  [连续打卡天数 火焰动画]             │      │
│  └─────────────────────────────────────┘    │
│                                             │
│  ┌──── 📋 最近训练记录 ──────────────┐      │
│  │  [日期 | 训练内容 | 正确率 | 状态] │      │
│  └─────────────────────────────────────┘    │
│                                             │
│  ┌──── 🏅 荣誉墙 (新增) ─────────────┐       │
│  │  [最佳记录卡片组]                   │       │
│  └─────────────────────────────────────┘    │
│                                             │
└─────────────────────────────────────────────┘
```

### 2.2 涉及文件清单

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| `css/profile.css` | **新建** | 个人档案页面完整样式（核心！） |
| `index.html` (根目录) | 已修改 | 已添加 profilePage HTML |
| `js/profile.js` | 增强 | 添加新板块的渲染逻辑 |
| `js/store/statistics.js` | **新建/增强** | 统计数据层（如不存在需新建） |

---

## 三、详细需求

### 3.1 🆕 模块一：profile.css 完整样式（优先级：P0）

这是当前最关键的问题——**样式文件缺失**。需要从零建立完整的 profile 样式。

#### 设计规范

**配色方案**（严格遵循蜜蜂主题）：
```css
/* 卡片背景 */
--profile-card-bg: rgba(255, 255, 255, 0.88);
--profile-card-border: rgba(212, 172, 56, 0.18);

/* 热图配色（蜂蜜色系渐变） */
--heatmap-level-0: #2d3436;        /* 无数据 */
--heatmap-level-1: rgba(212, 172, 56, 0.25);  /* 浅 */
--heatmap-level-2: rgba(212, 172, 56, 0.45);
--heatmap-level-3: rgba(212, 172, 56, 0.65);
--heatmap-level-4: rgba(212, 172, 56, 0.85);  /* 深 */
--heatmap-level-5: #FFD166;         /* 最深 */

/* 图表强调色 */
--chart-line: #d4ac38;
--chart-area-gradient-start: rgba(212, 172, 56, 0.3);
--chart-area-gradient-end: rgba(212, 172, 56, 0.02);
--chart-dot-active: #f59e0b;
--chart-dot-inactive: rgba(212, 172, 56, 0.2);

/* 等级系统 */
--level-progress-bg: rgba(212, 172, 56, 0.15);
--level-progress-fill: linear-gradient(90deg, #FFD166, #F59E0B);

/* 徽章 */
--badge-locked-opacity: 0.4;
--badge-locked-filter: grayscale(100%);
--badge-glow: 0 0 15px rgba(255, 209, 102, 0.5);
```

**字体规范**：
- 标题：`font-size: 20px; font-weight: 700; color: var(--bee-black);`
- 副标题：`font-size: 16px; font-weight: 600; color: var(--text-primary);`
- 正文：`font-size: 14px; color: var(--text-secondary);`
- 辅助文字：`font-size: 12px; color: var(--text-muted);`

**间距规范**：
- 板块间距：`margin-bottom: 28px;`
- 板块内边距：`padding: 24px;`
- 卡片圆角：`border-radius: var(--radius-lg);` (16px)
- 卡片阴影：`box-shadow: var(--shadow-md);`
- Hover效果：`transform: translateY(-3px); box-shadow: var(--shadow-bee);`

**动效规范**：
- 入场动画：`opacity: 0 → 1; transform: translateY(15px) → 0; duration: 400ms;`
- 数字递增动画：`easeOutCubic, 800-1500ms`
- 热图 tooltip 延迟：`200ms`
- 徽章解锁动画：`scale(0.8) → scale(1.1) → scale(1); bounce效果`

#### 具体组件样式要求

##### (A) 用户信息卡片 `.profile-header`
- 布局：Flex 横向排列（头像左侧 + 信息右侧）
- 头像：圆形，120px×120px，带蜜蜂徽章（右下角小圆角方形）
- 昵称：大号加粗，主文字色
- ID：辅助文字色
- 天数：高亮数字用 `var(--honey-yellow-dark)`
- 标签：圆角胶囊状，不同颜色区分

##### (B) 统计概览 `.stats-overview`
- Grid 4列等宽，响应式（<768px 变为 2列）
- 每个统计卡片居中对齐
- 数字使用 `animateNumber` 动画
- 图标 32px，数字 24px 加粗

##### (C) 活跃天数热图 `.heatmap-section`
- **严格参照 GitHub/TRAE 风格**：
  - 53列（含月份标签）× 7行
  - 每格 11px×11px，间距 3px
  - 左侧星期标签（Mon/Wed/Fri 或 M/W/F）
  - 顶部月份标签（Jan/Feb/Mar...）
  - 5级颜色深度
  - Hover 时显示 tooltip（日期+训练次数）
  - Tooltip 用绝对定位，z-index 提升
- 图例：Less → 5个渐变色块 → More
- 整体容器支持水平滚动（移动端友好）

##### (D) 学习时段分布 `.time-distribution-section`
- **严格参照 TRAE IDE 风格**：
  - SVG 实现，viewBox 自适应宽度
  - 贝塞尔曲线连接 24 个数据点
  - 曲线下方填充半透明渐变区域
  - 日间峰值标记 ☀️（6:00-12:00 区间最高点）
  - 夜间峰值标记 🌙（17:00-23:00 区间最高点）
  - 峰值点有脉冲动画（呼吸效果）
  - X轴标签：06:00, 12:00, 18:00, 24:00, 06:00
  - 无数据时显示空状态提示文案
- 底部提示文字："你最喜欢在XX点学习！"

##### (E) 等级系统 `.achievement-section > .level-card`
- 左侧：等级头像圆形图标（随等级变化 🐣→🐝→🦋）
- 右侧：等级名称 + EXP 进度条 + 数值
- 进度条：圆角胶囊形，填充色蜂蜜黄渐变
- 进度条有 500ms 延迟的 width 动画

##### (F) 徽章网格 `.badges-grid`
- 3列 Grid（或自适应 wrap flex）
- 每个徽章：图标 + 名称，纵向排列
- 锁定态：灰度滤镜 + 降低透明度 + 加锁emoji覆盖
- 解锁态：正常显示 + 微光阴影
- Hover：微微上浮

##### (G) 训练记录 `.recent-history-section`
- 列表形式，每项一行
- 包含：日期、活动描述、统计数据、状态标签
- 状态标签颜色：优秀=绿色，良好=黄色，继续=灰色
- 空状态：居中 emoji + 提示文字

---

### 3.2 🆕 模块二：学习数据看板（优先级：P1）

新增板块，展示更丰富的学习数据分析。

#### 功能需求
1. **本周 vs 上周对比柱状图**
   - 双柱并列对比（本周/上周）
   - 维度：训练次数、学习时长、正确率
   - 使用纯 CSS + 少量 JS 实现（不引入 Chart.js）
   - 柱子颜色：本周=`var(--honey-yellow)`，上周=`var(--honey-orange)` 半透明
   
2. **词汇量增长趋势折线图**
   - SVG 折线图，近30天的累计新学单词数
   - 平滑曲线，数据点可 hover 显示数值
   - Y轴自动缩放

3. **训练模式占比饼图**
   - CSS conic-gradient 实现饼图
   - 分类：词块填空、听力填空、词汇匹配、跟读练习
   - 图例在右侧或下方
   - 无数据时不渲染

#### HTML 结构
```html
<div class="data-dashboard-section">
    <div class="section-header">
        <h3 class="section-title">📊 学习数据看板</h3>
        <div class="dashboard-tabs">
            <button class="dash-tab active" data-tab="weekly">周对比</button>
            <button class="dash-tab" data-tab="vocabulary">词汇量</button>
            <button class="dash-tab" data-tab="modes">模式占比</button>
        </div>
    </div>
    <div class="dashboard-content" id="dashboardContainer">
        <!-- 由JS动态渲染 -->
    </div>
</div>
```

---

### 3.3 🆕 模块三：本周目标追踪（优先级：P1）

新增板块，增加游戏化和目标感。

#### 功能需求
1. **每日目标进度环**
   - 圆形进度环（SVG stroke-dasharray）
   - 目标：每天训练30分钟 / 完成10道题
   - 进度百分比 + 剩余量提示
   - 未达成时灰色/橙色，达成时绿色+✨特效

2. **连续打卡天数**
   - 大号火焰 emoji 🔥 + 数字
   - 连续天数越多火焰越大
   - 打破记录时触发庆祝动画
   - 旁边显示"历史最高: X天"

3. **本周概览卡片**
   - 7个小方格代表周一到周日
   - 已完成：蜂蜜黄色填充
   - 今日进行中：边框脉冲动画
   - 未来：浅灰虚线框
   - 点击可展开当日详情

#### HTML 结构
```html
<div class="goal-tracking-section">
    <div class="section-header">
        <h3 class="section-title">🎯 本周目标</h3>
        <span class="streak-badge">🔥 连续 <span id="streakDays">0</span> 天</span>
    </div>
    <div class="goal-content">
        <!-- 每日目标环 -->
        <div class="daily-goal-ring-container">
            <svg class="goal-ring" viewBox="0 0 120 120">
                <!-- 背景环 -->
                <circle cx="60" cy="60" r="50" fill="none" 
                    stroke="rgba(212,172,56,0.15)" stroke-width="10"/>
                <!-- 进度环 -->
                <circle cx="60" cy="60" r="50" fill="none" 
                    stroke="url(#goalGradient)" stroke-width="10"
                    stroke-dasharray="314" stroke-dashoffset="314"
                    stroke-linecap="round" class="goal-progress-ring"/>
                <defs>
                    <linearGradient id="goalGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stop-color="#FFD166"/>
                        <stop offset="100%" stop-color="#F59E0B"/>
                    </linearGradient>
                </defs>
            </svg>
            <div class="goal-center-text">
                <span id="goalPercent">0%</span>
                <small>今日目标</small>
            </div>
        </div>
        
        <!-- 本周日历 -->
        <div class="week-calendar">
            <div class="week-day" data-day="mon">一</div>
            <div class="week-day" data-day="tue">二</div>
            <div class="week-day" data-day="wed">三</div>
            <div class="week-day" data-day="thu">四</div>
            <div class="week-day" data-day="fri">五</div>
            <div class="week-day" data-day="sat">六</div>
            <div class="week-day" data-day="sun">日</div>
        </div>
        
        <!-- 目标详情 -->
        <div class="goal-details">
            <div class="goal-item">
                <span class="goal-label">⏱️ 学习时间</span>
                <span><span id="todayMinutes">0</span>/30 min</span>
            </div>
            <div class="goal-item">
                <span class="goal-label">✅ 完成题目</span>
                <span><span id="todayQuestions">0</span>/10 题</span>
            </div>
        </div>
    </div>
</div>
```

---

### 3.4 🆕 模块四：荣誉墙（优先级：P2）

新增板块，展示用户的最佳记录和高光时刻。

#### 功能需求
1. **最佳记录卡片组**（横向滚动或Grid）
   - 🏆 最高连续正确：X题连对
   - ⚡ 最快答题速度：平均 X秒/题
   - 📚 最长单次学习：X分钟
   - 🎯 最高单次正确率：XXX%
   - 📖 最多单日词汇：X个新词
   - 🔥 最长连续打卡：X天

2. **里程碑时间线**
   - 首次登录、首次完成训练、首次满分、达到Lv.X...
   - 垂直时间线，左侧圆点+右侧内容
   - 圆点颜色根据类型区分

#### HTML 结构
```html
<div class="honor-wall-section">
    <div class="section-header">
        <h3 class="section-title">🏅 荣誉墙</h3>
    </div>
    
    <!-- 最佳记录 -->
    <div class="best-records-grid">
        <div class="record-card">
            <span class="record-icon">🏆</span>
            <span class="record-value" id="recordStreak">0</span>
            <span class="record-label">最高连对</span>
        </div>
        <!-- 更多记录卡片... -->
    </div>
    
    <!-- 里程碑时间线 -->
    <div class="milestone-timeline" id="milestoneTimeline">
        <!-- JS动态生成 -->
    </div>
</div>
```

---

### 3.5 🆕 模块五：Statistics 数据层增强（优先级：P0 基础）

当前 `js/profile.js` 引用了 `js/store/statistics.js`，但该文件可能不存在或不完整。

#### 必须实现的方法

```javascript
class Statistics {
    // ===== 基础统计 =====
    static getStats()                          // 返回 { totalTrainings, totalCorrect, totalWrong, totalTimeSeconds }
    static getAccuracy()                       // 返回正确率百分比
    
    // ===== 活跃天数 =====
    static getUsageDays()                      // 返回总活跃天数
    static getDailyActivity()                  // 返回 { '2026-03-24': 5, ... } 近365天数据
    static recordActivity(date)                // 记录某天的活动
    
    // ===== 时段分布 =====
    static getHourlyDistribution()             // 返回 { '00': 0, '01': 0, ..., '23': 5 }
    static recordHourlyActivity(hour)          // 记录某小时的活动
    
    // ===== 等级系统 =====
    static getLevelInfo()                      // 返回 { currentLevel, currentExp, nextExp, progressPercent }
    static addExp(amount)                      // 增加经验值
    
    // ===== 徽章系统 =====
    static getBadges()                         // 返回徽章数组 [{id, name, icon, unlocked, unlockedAt}]
    static checkAndUnlockBadges()             // 检查并解锁符合条件的徽章
    
    // ===== 训练记录 =====
    static recordTraining(data)                // 记录一次训练 { correctCount, wrongCount, timeSpent, resourceTitle, mode }
    static getHistoryRecords(limit)            // 返回最近的训练记录
    
    // ===== 新增：目标追踪 =====
    static getTodayProgress()                  // 返回今日进度 { minutes, questions, percent }
    static getStreakDays()                     // 返回连续打卡天数
    static getWeekProgress()                   // 返回本周7天完成情况 []
    
    // ===== 新增：荣誉墙 =====
    static getBestRecords()                    // 返回最佳记录 {}
    static getMilestones()                     // 返回里程碑事件 []
    
    // ===== 工具方法 =====
    static formatTimeSpent(seconds)            // 格式化秒数为 "Xh Xm" 或 "Xmin"
    static save()                              // 持久化到 localStorage
    static load()                              // 从 localStorage 读取
}
```

#### 数据存储结构 (localStorage)
```json
{
    "beelisten_statistics": {
        "totalTrainings": 42,
        "totalCorrect": 380,
        "totalWrong": 95,
        "totalTimeSeconds": 12600,
        "currentExp": 850,
        "dailyActivity": { "2026-03-24": 3, "2026-03-23": 5 },
        "hourlyDistribution": { "09": 12, "14": 8, "20": 22 },
        "badges": { "first-training": true, "streak-7": false },
        "history": [...],
        "goals": { "streak": 5, "maxStreak": 12 },
        "records": { "maxStreak": 15, "bestAccuracy": 100 },
        "milestones": [...]
    }
}
```

---

## 四、交互与动效规格

### 4.1 页面入场动画
```css
/* 所有板块依次入场 */
.profile-header      { animation: fadeSlideUp 0.5s ease 0ms both; }
.stats-overview      { animation: fadeSlideUp 0.5s ease 100ms both; }
.heatmap-section     { animation: fadeSlideUp 0.5s ease 200ms both; }
.time-distribution   { animation: fadeSlideUp 0.5s ease 300ms both; }
.achievement-section { animation: fadeSlideUp 0.5s ease 400ms both; }
.data-dashboard      { animation: fadeSlideUp 0.5s ease 500ms both; }
.goal-tracking       { animation: fadeSlideUp 0.5s ease 600ms both; }
.honor-wall          { animation: fadeSlideUp 0.5s ease 700ms both; }
.recent-history      { animation: fadeSlideUp 0.5s ease 800ms both; }

@keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
}
```

### 4.2 热图交互
- 格子 hover：放大 1.3x + z-index 提升 + tooltip 显示
- Tooltip 延迟 200ms 出现，鼠标离开立即消失
- 今日格子：外圈 2px 蜂蜜黄色边框 + 轻微脉冲

### 4.3 时段图表交互
- 数据点 hover：放大 + 显示具体数值 title
- 峰值点（☀️🌙）：持续呼吸动画
- 曲线绘制动画（可选，stroke-dashoffset）

### 4.4 数字动画
```javascript
// easeOutCubic 缓动
// 统计数字：800-1500ms
// 经验值：1000ms
// 进度百分比：1200ms
// 连续天数：500ms（快速跳动感）
```

### 4.5 徽章解锁通知
- 从右侧滑入（已有实现）
- 保留 3.5 秒后滑出
- 支持同时多个通知堆叠

---

## 五、响应式适配

### 5.1 断点定义
| 断点 | 宽度 | 布局变化 |
|------|------|---------|
| Desktop | ≥1200px | 完整布局 |
| Tablet | 768px-1199px | 统计卡变为3列，热图允许横向滚动 |
| Mobile | <768px | 统计卡2列，用户信息卡片纵向排列 |

### 5.2 移动端特殊处理
- 热图容器：`overflow-x: auto; white-space: nowrap;`
- 时段图表：高度减半至 140px
- 徽章网格：2列
- 目标追踪：进度环缩小至 80px
- 荣誉墙记录卡片：2列

---

## 六、开发优先级排序

| 优先级 | 任务 | 预估工作量 | 依赖 |
|-------|------|-----------|-----|
| **P0** | 创建 `profile.css` 完整样式 | 3-4小时 | 无 |
| **P0** | 创建/完善 `statistics.js` 数据层 | 2-3小时 | 无 |
| **P1** | 增强 `profile.js` 渲染逻辑（现有板块） | 1-2小时 | P0 CSS |
| **P1** | 新增「学习数据看板」板块 | 2-3小时 | P0 Statistics |
| **P1** | 新增「本周目标追踪」板块 | 2-3小时 | P0 Statistics |
| **P2** | 新增「荣誉墙」板块 | 1-2小时 | P0 Statistics |
| **P2** | 入场动画和微交互打磨 | 1小时 | 全部完成后 |

---

## 七、注意事项 & 避坑指南

### ⚠️ 关键注意点
1. **profile.css 必须新建** — 当前项目中该文件缺失，这是最紧急的问题
2. **不要引入第三方图表库** — 保持项目轻量，所有图表用原生 SVG/CSS 实现
3. **localStorage 容量限制** — 约5MB，365天热图数据约 3KB，完全够用
4. **图片路径** — 头像图片路径是 `../Beelisten ip形象/英语学习 IP 形象设1计.png`，注意保持一致
5. **CSS变量引用** — 所有硬编码颜色必须替换为 `variables.css` 中定义的变量

### 🔧 给 AI 的实现建议
1. 先写 `profile.css`（从用户信息卡片开始，自上而下）
2. 再写 `statistics.js` 数据层（确保所有 get 方法都有默认返回值）
3. 最后修改 `profile.js` 的 render 方法
4. 每完成一个板块就测试一下视觉效果
5. 热图的格子尺寸要精确计算（11px + 3px gap = 14px/格，52周 = 728px + 标签区）

### 🐝 品牌特色强化建议
- 等级名称可以用蜜蜂成长体系：🐣蛋→🐝工蜂→🐜蜂后→🦋金蜂
- 连续打卡的火焰可以用蜂蜜滴落效果替代
- 徽章解锁时的通知可以加入蜜蜂飞舞动画
- 进度条的填充可以用蜂蜜流动渐变

---

## 八、验收标准

- [ ] 个人档案页面完整展示所有板块，无空白/溢出
- [ ] 热图正确渲染 365 天数据，hover 显示正确 tooltip
- [ ] 时段分布图曲线平滑，峰值标记位置准确
- [ ] 统计数字有递增动画效果
- [ ] 等级进度条有填充动画
- [ ] 徽章锁定/解锁状态视觉差异明显
- [ ] 移动端（375px）下布局正常，无横向滚动条（除热图）
- [ ] 所有颜色使用 CSS 变量，无硬编码色值
- [ ] localStorage 数据读写正常，刷新后数据保持
- [ ] 页面加载性能 < 2秒

---

## 九、附录：代码模板参考

### 9.1 profile.css 模板结构
```css
/* ========================================
   个人档案页面样式 - profile.css
   ======================================== */

/* ===== 页面整体 ===== */
#profilePage {
    padding: 20px 30px;
    max-width: 1200px;
    margin: 0 auto;
}

/* ===== Section 通用 ===== */
.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
}

.section-title {
    font-size: 18px;
    font-weight: 700;
    color: var(--bee-black);
}

/* ===== A. 用户信息卡片 ===== */
.profile-header {
    background: var(--profile-card-bg);
    border-radius: var(--radius-lg);
    padding: 30px;
    margin-bottom: 28px;
    display: flex;
    align-items: center;
    gap: 24px;
    border: 1px solid var(--profile-card-border);
    box-shadow: var(--shadow-md);
}

/* ... 更多样式 ... */

/* ===== B. 统计概览 ===== */
.stats-overview {
    margin-bottom: 28px;
}

.stats-overview .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
}

/* ... 更多样式 ... */

/* ===== C. 活跃天数热图 ===== */
.heatmap-section {
    background: var(--profile-card-bg);
    border-radius: var(--radius-lg);
    padding: 24px;
    margin-bottom: 28px;
}

.heatmap-grid {
    display: grid;
    /* 53列：月份标签 + 52周 */
    grid-template-columns: 40px repeat(52, 14px);
    gap: 3px;
}

.heatmap-cell {
    width: 11px;
    height: 11px;
    border-radius: 2px;
    background: var(--heatmap-level-0);
}

.heatmap-cell.level-1 { background: var(--heatmap-level-1); }
.heatmap-cell.level-2 { background: var(--heatmap-level-2); }
.heatmap-cell.level-3 { background: var(--heatmap-level-3); }
.heatmap-cell.level-4 { background: var(--heatmap-level-4); }
.heatmap-cell.level-5 { background: var(--heatmap-level-5); }

/* ... 更多样式 ... */

/* ===== D. 学习时段分布 ===== */
.time-distribution-section {
    background: var(--profile-card-bg);
    border-radius: var(--radius-lg);
    padding: 24px;
    margin-bottom: 28px;
}

.time-chart-svg {
    width: 100%;
    height: auto;
}

.time-curve {
    fill: none;
    stroke: var(--chart-line);
    stroke-width: 2.5;
    stroke-linecap: round;
}

/* ... 更多样式 ... */

/* ===== E. 等级系统 ===== */
.achievement-section {
    background: var(--profile-card-bg);
    border-radius: var(--radius-lg);
    padding: 24px;
    margin-bottom: 28px;
}

.level-card {
    background: linear-gradient(135deg, rgba(255,209,102,0.1), rgba(245,158,11,0.05));
    border-radius: var(--radius-md);
    padding: 20px;
    margin-bottom: 24px;
}

.level-progress-bar {
    height: 10px;
    background: var(--level-progress-bg);
    border-radius: 999px;
    overflow: hidden;
}

.level-progress-fill {
    height: 100%;
    background: var(--level-progress-fill);
    border-radius: 999px;
    transition: width 0.5s ease 0.5s;
}

/* ... 更多样式 ... */

/* ===== F. 徽章网格 ===== */
.badges-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
}

.badge-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
    background: rgba(255,255,255,0.6);
    border-radius: var(--radius-md);
    border: 1px solid rgba(212,172,56,0.1);
}

.badge-item.locked {
    opacity: var(--badge-locked-opacity);
    filter: var(--badge-locked-filter);
}

.badge-item.unlocked {
    box-shadow: var(--badge-glow);
}

/* ... 更多样式 ... */

/* ===== G. 训练记录 ===== */
.recent-history-section {
    background: var(--profile-card-bg);
    border-radius: var(--radius-lg);
    padding: 24px;
    margin-bottom: 28px;
}

.history-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.history-item {
    display: flex;
    align-items: center;
    padding: 16px;
    background: rgba(255,255,255,0.5);
    border-radius: var(--radius-sm);
    border: 1px solid rgba(212,172,56,0.1);
}

/* ... 更多样式 ... */

/* ===== H. 学习数据看板 (新增) ===== */
.data-dashboard-section {
    background: var(--profile-card-bg);
    border-radius: var(--radius-lg);
    padding: 24px;
    margin-bottom: 28px;
}

.dashboard-tabs {
    display: flex;
    gap: 8px;
}

.dash-tab {
    padding: 6px 16px;
    border: none;
    background: rgba(212,172,56,0.1);
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: all 0.2s ease;
}

.dash-tab.active {
    background: var(--honey-yellow);
    color: var(--bee-black);
    font-weight: 600;
}

/* ... 更多样式 ... */

/* ===== I. 本周目标追踪 (新增) ===== */
.goal-tracking-section {
    background: var(--profile-card-bg);
    border-radius: var(--radius-lg);
    padding: 24px;
    margin-bottom: 28px;
}

.goal-content {
    display: grid;
    grid-template-columns: 140px 1fr;
    gap: 24px;
    align-items: start;
}

.daily-goal-ring-container {
    position: relative;
    width: 120px;
    height: 120px;
}

.goal-center-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
}

.goal-progress-ring {
    transform: rotate(-90deg);
    transform-origin: 50% 50%;
    transition: stroke-dashoffset 1s ease;
}

/* ... 更多样式 ... */

/* ===== J. 荣誉墙 (新增) ===== */
.honor-wall-section {
    background: var(--profile-card-bg);
    border-radius: var(--radius-lg);
    padding: 24px;
    margin-bottom: 28px;
}

.best-records-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-bottom: 24px;
}

.record-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
    background: linear-gradient(135deg, rgba(255,209,102,0.15), rgba(245,158,11,0.08));
    border-radius: var(--radius-md);
    border: 1px solid rgba(212,172,56,0.2);
}

/* ... 更多样式 ... */

/* ===== 响应式适配 ===== */
@media (max-width: 1199px) {
    .stats-overview .stats-grid {
        grid-template-columns: repeat(3, 1fr);
    }
}

@media (max-width: 768px) {
    #profilePage {
        padding: 16px;
    }
    
    .profile-header {
        flex-direction: column;
        text-align: center;
    }
    
    .stats-overview .stats-grid {
        grid-template-columns: repeat(2, 1fr);
    }
    
    .badges-grid,
    .best-records-grid {
        grid-template-columns: repeat(2, 1fr);
    }
    
    .goal-content {
        grid-template-columns: 1fr;
    }
}

/* ===== 动画关键帧 ===== */
@keyframes fadeSlideUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes breathe {
    0%, 100% {
        transform: scale(1);
        opacity: 1;
    }
    50% {
        transform: scale(1.1);
        opacity: 0.7;
    }
}

@keyframes pulse {
    0%, 100% {
        box-shadow: 0 0 0 0 rgba(255, 209, 102, 0.4);
    }
    50% {
        box-shadow: 0 0 0 8px rgba(255, 209, 102, 0);
    }
}
```

### 9.2 statistics.js 模板结构
```javascript
/**
 * 统计数据管理模块 - BeeListen v2
 * 负责学习统计、等级系统、徽章、目标追踪等数据
 */

const STORAGE_KEY = 'beelisten_statistics';

class Statistics {
    // ===== 数据存储 =====
    static data = null;
    
    static getDefaultData() {
        return {
            totalTrainings: 0,
            totalCorrect: 0,
            totalWrong: 0,
            totalTimeSeconds: 0,
            currentExp: 0,
            dailyActivity: {},
            hourlyDistribution: {},
            badges: {},
            history: [],
            goals: { streak: 0, maxStreak: 0, lastActiveDate: null },
            records: {
                maxStreak: 0,
                bestAccuracy: 0,
                fastestSpeed: 0,
                longestSession: 0,
                mostDailyVocab: 0,
                maxDailyQuestions: 0
            },
            milestones: [],
            vocabularyLearned: {}
        };
    }
    
    static load() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            this.data = saved ? JSON.parse(saved) : this.getDefaultData();
        } catch (e) {
            console.error('[Statistics] 加载数据失败:', e);
            this.data = this.getDefaultData();
        }
    }
    
    static save() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
        } catch (e) {
            console.error('[Statistics] 保存数据失败:', e);
        }
    }
    
    // ===== 基础统计 =====
    static getStats() {
        return {
            totalTrainings: this.data.totalTrainings || 0,
            totalCorrect: this.data.totalCorrect || 0,
            totalWrong: this.data.totalWrong || 0,
            totalTimeSeconds: this.data.totalTimeSeconds || 0
        };
    }
    
    static getAccuracy() {
        const { totalCorrect, totalWrong } = this.getStats();
        const total = totalCorrect + totalWrong;
        return total > 0 ? Math.round((totalCorrect / total) * 100) : 0;
    }
    
    // ===== 活跃天数 =====
    static getUsageDays() {
        return Object.keys(this.data.dailyActivity || {}).length;
    }
    
    static getDailyActivity() {
        return this.data.dailyActivity || {};
    }
    
    // ===== 时段分布 =====
    static getHourlyDistribution() {
        return this.data.hourlyDistribution || {};
    }
    
    // ===== 等级系统 =====
    static getLevelInfo() {
        const exp = this.data.currentExp || 0;
        const levels = [
            { name: '新手小蜜蜂', icon: '🐣', minExp: 0 },
            { name: '勤奋工蜂', icon: '🐝', minExp: 100 },
            { name: '智慧蜂后', icon: '👑', minExp: 300 },
            { name: '金翼蜂王', icon: '🦋', minExp: 600 },
            { name: '传奇蜂神', icon: '🌟', minExp: 1000 }
        ];
        
        let currentLevel = levels[0];
        for (let i = levels.length - 1; i >= 0; i--) {
            if (exp >= levels[i].minExp) {
                currentLevel = levels[i];
                break;
            }
        }
        
        const nextLevelIndex = levels.findIndex(l => l.name === currentLevel.name) + 1;
        const nextLevel = levels[nextLevelIndex] || currentLevel;
        const nextExp = nextLevel.minExp;
        
        const progress = exp - currentLevel.minExp;
        const needed = nextExp - currentLevel.minExp;
        const progressPercent = nextLevelIndex < levels.length 
            ? Math.min(100, Math.round((progress / needed) * 100))
            : 100;
        
        return {
            currentLevel,
            currentExp: exp,
            nextExp,
            progressPercent
        };
    }
    
    static addExp(amount) {
        this.data.currentExp = (this.data.currentExp || 0) + amount;
        this.save();
        
        // 检查等级提升和徽章
        document.dispatchEvent(new CustomEvent('exp-added', {
            detail: { amount, totalExp: this.data.currentExp }
        }));
    }
    
    // ===== 徽章系统 =====
    static getBadges() {
        const allBadges = [
            { id: 'first-training', name: '初次尝试', icon: '🌟' },
            { id: 'streak-7', name: '连续7天', icon: '🔥' },
            { id: 'perfect-score', name: '满分达人', icon: '💯' },
            { id: 'vocabulary-100', name: '词汇大师', icon: '📖' },
            { id: 'listening-10h', name: '听力狂人', icon: '🎧' },
            { id: 'training-50', name: '训练达人', icon: '💪' }
        ];
        
        return allBadges.map(badge => ({
            ...badge,
            unlocked: this.data.badges?.[badge.id] || false
        }));
    }
    
    static checkAndUnlockBadges() {
        const unlocked = [];
        
        // 首次训练
        if (this.data.totalTrainings >= 1 && !this.data.badges['first-training']) {
            this.data.badges['first-training'] = true;
            unlocked.push('first-training');
        }
        
        // 连续7天
        if (this.data.goals.streak >= 7 && !this.data.badges['streak-7']) {
            this.data.badges['streak-7'] = true;
            unlocked.push('streak-7');
        }
        
        // 满分达人
        if (this.data.records.bestAccuracy === 100 && !this.data.badges['perfect-score']) {
            this.data.badges['perfect-score'] = true;
            unlocked.push('perfect-score');
        }
        
        // 训练50次
        if (this.data.totalTrainings >= 50 && !this.data.badges['training-50']) {
            this.data.badges['training-50'] = true;
            unlocked.push('training-50');
        }
        
        if (unlocked.length > 0) {
            this.save();
            unlocked.forEach(badgeId => {
                const badge = this.getBadges().find(b => b.id === badgeId);
                document.dispatchEvent(new CustomEvent('badge-unlocked', {
                    detail: { badgeId, badgeName: badge.name, badgeIcon: badge.icon }
                }));
            });
        }
        
        return unlocked;
    }
    
    // ===== 训练记录 =====
    static recordTraining(data) {
        const { correctCount, wrongCount, timeSpent, resourceTitle, mode, isPerfectScore } = data;
        
        // 更新统计
        this.data.totalTrainings++;
        this.data.totalCorrect += correctCount;
        this.data.totalWrong += wrongCount;
        this.data.totalTimeSeconds += timeSpent;
        
        // 更新记录
        const accuracy = Math.round((correctCount / (correctCount + wrongCount)) * 100);
        if (accuracy > this.data.records.bestAccuracy) {
            this.data.records.bestAccuracy = accuracy;
        }
        if (timeSpent > this.data.records.longestSession) {
            this.data.records.longestSession = timeSpent;
        }
        
        // 记录活动
        const today = new Date().toISOString().split('T')[0];
        this.data.dailyActivity[today] = (this.data.dailyActivity[today] || 0) + 1;
        
        const hour = new Date().getHours();
        this.data.hourlyDistribution[hour] = (this.data.hourlyDistribution[hour] || 0) + 1;
        
        // 更新连续天数
        this.updateStreak(today);
        
        // 增加经验值
        const expGain = correctCount * 5 + (isPerfectScore ? 20 : 0);
        this.addExp(expGain);
        
        // 记录历史
        this.data.history.unshift({
            date: today,
            time: new Date().toISOString(),
            correctCount,
            wrongCount,
            timeSpent,
            resourceTitle,
            mode,
            accuracy
        });
        
        // 只保留最近100条
        if (this.data.history.length > 100) {
            this.data.history = this.data.history.slice(0, 100);
        }
        
        this.save();
        this.checkAndUnlockBadges();
        
        document.dispatchEvent(new CustomEvent('statistics-updated'));
    }
    
    static getHistoryRecords(limit = 10) {
        return (this.data.history || []).slice(0, limit);
    }
    
    // ===== 目标追踪 =====
    static updateStreak(today) {
        const lastDate = this.data.goals.lastActiveDate;
        
        if (lastDate === today) {
            return; // 今天已经记录过
        }
        
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        
        if (lastDate === yesterday) {
            this.data.goals.streak++;
        } else if (lastDate !== today) {
            this.data.goals.streak = 1;
        }
        
        if (this.data.goals.streak > this.data.goals.maxStreak) {
            this.data.goals.maxStreak = this.data.goals.streak;
        }
        
        this.data.goals.lastActiveDate = today;
    }
    
    static getStreakDays() {
        return this.data.goals?.streak || 0;
    }
    
    static getTodayProgress() {
        const today = new Date().toISOString().split('T')[0];
        const todayRecords = this.data.history.filter(h => h.date === today);
        
        const minutes = Math.round(todayRecords.reduce((sum, r) => sum + r.timeSpent, 0) / 60);
        const questions = todayRecords.reduce((sum, r) => sum + r.correctCount + r.wrongCount, 0);
        
        const goalMinutes = 30;
        const goalQuestions = 10;
        
        const percent = Math.min(100, Math.round((minutes / goalMinutes + questions / goalQuestions) / 2 * 100));
        
        return { minutes, questions, percent };
    }
    
    static getWeekProgress() {
        const week = [];
        const today = new Date();
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateKey = date.toISOString().split('T')[0];
            
            week.push({
                date: dateKey,
                day: ['日', '一', '二', '三', '四', '五', '六'][date.getDay()],
                completed: this.data.dailyActivity[dateKey] > 0
            });
        }
        
        return week;
    }
    
    // ===== 荣誉墙 =====
    static getBestRecords() {
        return this.data.records || {};
    }
    
    static getMilestones() {
        const milestones = [];
        
        if (this.data.totalTrainings >= 1) {
            milestones.push({ type: 'first', text: '首次完成训练', icon: '🎯' });
        }
        if (this.data.records.bestAccuracy === 100) {
            milestones.push({ type: 'perfect', text: '首次满分', icon: '💯' });
        }
        if (this.data.goals.maxStreak >= 7) {
            milestones.push({ type: 'streak', text: '连续打卡7天', icon: '🔥' });
        }
        if (this.data.totalTrainings >= 10) {
            milestones.push({ type: 'count', text: '完成10次训练', icon: '📊' });
        }
        
        return milestones;
    }
    
    // ===== 工具方法 =====
    static formatTimeSpent(seconds) {
        if (seconds < 60) return `${seconds}s`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}min`;
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
}

// 初始化加载
Statistics.load();

export default Statistics;
```

---

> 💡 **使用说明**：将此 PDR 发给 AI 编程助手（如 Cursor、Claude Code、ChatGPT 等），让它按照文档逐步实现。建议按 P0 → P1 → P2 顺序执行。
