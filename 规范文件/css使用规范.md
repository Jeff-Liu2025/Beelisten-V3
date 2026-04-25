# CSS模块化重构说明

## 文件结构

```
css/
├── variables.css      # 变量（颜色、字体、间距等）
├── reset.css          # 重置样式
├── layout.css         # 布局框架
├── sidebar.css        # 侧边栏
├── player.css         # 播放器
├── podcast.css        # 播客相关
├── training.css       # 训练模块
├── review.css         # 复习模块
├── components.css     # 通用组件
└── animations.css     # 动画+响应式
```

---

## HTML引入顺序（重要！）

**必须按照以下顺序引入CSS文件：**

```html
<!-- 1. 变量文件（最先引入） -->
<link rel="stylesheet" href="css/variables.css">

<!-- 2. 重置样式 -->
<link rel="stylesheet" href="css/reset.css">

<!-- 3. 布局框架 -->
<link rel="stylesheet" href="css/layout.css">

<!-- 4. 侧边栏 -->
<link rel="stylesheet" href="css/sidebar.css">

<!-- 5. 播放器 -->
<link rel="stylesheet" href="css/player.css">

<!-- 6. 播客模块 -->
<link rel="stylesheet" href="css/podcast.css">

<!-- 7. 训练模块 -->
<link rel="stylesheet" href="css/training.css">

<!-- 8. 复习模块 -->
<link rel="stylesheet" href="css/review.css">

<!-- 9. 通用组件 -->
<link rel="stylesheet" href="css/components.css">

<!-- 10. 动画和响应式（最后引入） -->
<link rel="stylesheet" href="css/animations.css">
```

---

## 各文件职责说明

### 1. variables.css - CSS变量
**用途**：定义整个网站的设计系统基础
- 蜜蜂风格主题色（蜂蜜黄、蜜蜂黑等）
- 间距系统（4px基准）
- 圆角系统
- 过渡动画时长
- 字体系统

**修改指南**：
- 改主题颜色 → 修改 `--honey-*` 和 `--bee-*` 变量
- 改间距 → 修改 `--space-*` 变量
- 改字体 → 修改 `--font-*` 变量

---

### 2. reset.css - 重置样式
**用途**：统一浏览器默认样式
- 全局重置（margin、padding、box-sizing）
- body全局样式
- 自定义滚动条
- 禁止文本选择

**注意**：一般不需要修改

---

### 3. layout.css - 布局框架
**用途**：页面整体布局
- 主容器布局（侧边栏 + 主内容区）
- 全屏模式
- 页面头部
- 页面内容切换

**修改指南**：
- 改侧边栏宽度 → 修改 `.sidebar` 的 `width` 和 `.main-content` 的 `margin-left`

---

### 4. sidebar.css - 侧边栏
**用途**：导航栏相关样式
- 侧边栏容器
- Logo区域
- 导航菜单
- 菜单项激活状态

**修改指南**：
- 改菜单项样式 → 修改 `.menu-item` 相关
- 改激活状态 → 修改 `.menu-item.active`

---

### 5. player.css - 播放器
**用途**：音频播放器相关
- 底部播放器容器
- 播放控制按钮
- 进度条
- 音量控制
- 变速选择器
- 字幕显示区

**修改指南**：
- 改进度条颜色 → 修改 `.progress-filled` 的 `background`
- 改按钮大小 → 修改 `.control-btn` 的 `width` 和 `height`

---

### 6. podcast.css - 播客模块
**用途**：播客列表和详情页
- 播客列表页样式
- 播客详情页样式
- 字幕区域
- 播放列表
- 更多操作菜单

**修改指南**：
- 改字幕高亮 → 修改 `.subtitle-item.highlighted`

---

### 7. training.css - 训练模块
**用途**：词汇训练和练习
- 词汇拖块练习
- 随机填空练习
- 词块填空训练
- 训练播放器
- 难度选择器

**修改指南**：
- 改词汇块样式 → 修改 `.word-block` 和 `.fill-candidate`

---

### 8. review.css - 复习模块
**用途**：复习页面
- 复习统计卡片
- 复习模式选择
- 复习计划展示
- 复习历史记录
- 复习练习弹窗

**修改指南**：
- 改统计卡片 → 修改 `.stat-card`

---

### 9. components.css - 通用组件
**用途**：可复用UI组件
- 按钮组件
- 弹窗组件
- 卡片组件
- 搜索框组件
- 单词查询浮动框
- 分类导航
- 推荐区域

**修改指南**：
- 改按钮样式 → 修改 `.btn` 相关
- 改弹窗样式 → 修改各类 popup 样式

---

### 10. animations.css - 动画和响应式
**用途**：动画关键帧和全局响应式
- 所有动画关键帧（fadeIn、popIn、shake等）
- 全局响应式媒体查询
- 加载动画

**注意**：响应式样式统一放在这里管理

---

## 如何定位Bug

### 播放器相关Bug
→ 查看 `player.css`

### 侧边栏Bug
→ 查看 `sidebar.css` 和 `layout.css`

### 字幕显示Bug
→ 查看 `podcast.css` 的字幕区域部分

### 训练功能Bug
→ 查看 `training.css`

### 复习功能Bug
→ 查看 `review.css`

### 通用组件Bug（按钮、弹窗等）
→ 查看 `components.css`

### 动画问题
→ 查看 `animations.css`

### 布局问题
→ 查看 `layout.css`

### 颜色/间距/字体问题
→ 先查看 `variables.css`

---

## 注意事项

1. **引入顺序很重要**！`variables.css` 必须最先引入，因为其他文件依赖这些变量

2. **修改颜色只需改一处**：所有颜色变量都在 `variables.css` 中，修改一处全局生效

3. **响应式样式集中在animations.css**：方便统一管理不同屏幕尺寸的适配

4. **每个文件都有详细注释**：说明用途和修改指南，方便AI理解

5. **如果需要新增样式**：
   - 新功能模块 → 创建新文件
   - 通用组件 → 添加到 `components.css`
   - 动画 → 添加到 `animations.css`

---

## 原文件对比

原文件：`style.css`（4635行，耦合度高）

重构后：10个模块化文件，职责清晰，易于维护

---

祝你的英语听力网站重构顺利！🐝
