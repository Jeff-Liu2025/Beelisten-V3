# CET精听测验模式优化 Spec

## Why
当前精听测验模式对所有资源都调用API生成题目，但对于4级/6级考试真题，应该使用原始听力材料中的真实题目，更贴近实际考试场景，提升学习效果。

## What Changes
- 4级/6级考试资源（category: "exam"）使用原始srt中的题目，不调用API生成
- 题目出现时间按srt中的时间戳展示
- 资源选择页面添加分段显示功能（与词块填空一致）
- 选项数据使用JSON文件存储，支持手动填入真题选项
- 解析内容由API生成

## Impact
- Affected specs: 精听测验模块
- Affected code: 
  - `js/quiz-select.js` - 添加分段显示
  - `js/quiz-training.js` - 区分exam资源处理逻辑
  - `js/quiz-generator.js` - 添加真题数据加载
  - `quiz-select.html` - 添加分段UI结构
  - `data/quiz/` - 存储真题选项JSON

## ADDED Requirements

### Requirement: 考试资源分段显示
系统应在精听测验资源选择页面为考试类资源（category: "exam"）提供分段显示功能。

#### Scenario: 用户查看考试资源分段
- **WHEN** 用户点击考试资源卡片
- **THEN** 系统展开显示该资源的分段列表（按Section/News Report等分组）
- **AND** 每个分段显示包含的题目数量和时间范围

### Requirement: 真题题目展示
系统应为考试类资源使用原始srt中的题目，而非API生成。

#### Scenario: 用户开始考试资源测验
- **WHEN** 用户选择考试类资源开始测验
- **THEN** 系统从srt文件中提取问题文本和时间戳
- **AND** 按照srt中的时间顺序展示题目
- **AND** 从JSON文件加载选项数据

#### Scenario: 选项数据未准备好
- **WHEN** 某道题目的选项数据尚未填入
- **THEN** 系统显示虚拟占位选项（A/B/C/D选项显示"选项待补充"）

### Requirement: 真题选项数据存储
系统应支持从JSON文件加载真题选项数据。

#### Scenario: 加载选项数据
- **WHEN** 系统加载考试资源题目
- **THEN** 从 `data/quiz/{resourceId}_questions.json` 文件读取选项
- **AND** 文件格式包含：题目序号、选项文本、正确答案、解析

### Requirement: API生成解析
系统应为已作答的题目调用API生成解析内容。

#### Scenario: 用户答完题目
- **WHEN** 用户选择答案后
- **THEN** 系统调用API生成该题的解析说明
- **AND** 解析缓存到本地避免重复调用

## MODIFIED Requirements

### Requirement: 资源选择页面
原有资源选择页面仅显示资源列表，现需支持分段展开功能。

#### Scenario: 展开分段
- **WHEN** 用户点击资源卡片
- **THEN** 系统加载该资源的分段信息
- **AND** 展开显示分段列表
- **AND** 支持点击分段直接开始该分段练习

### Requirement: 训练页面逻辑
原有训练页面统一调用API生成选项，现需区分资源类型。

#### Scenario: 考试资源训练
- **WHEN** 训练考试类资源
- **THEN** 使用srt原始题目 + JSON选项数据
- **AND** 不调用API生成题目

#### Scenario: 非考试资源训练
- **WHEN** 训练非考试类资源（podcast、storycorps等）
- **THEN** 继续使用API生成题目（保持原有逻辑）

## REMOVED Requirements
无移除的需求。
