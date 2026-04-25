# CET精听测验问题显示时机优化 Spec

## Why
当前精听测验存在三个问题：1) 问题显示时机不对，应该在问题英文句子读完之后才显示；2) 问题中文翻译不应该在答题前显示；3) 考试资源需要调用API生成选项解析。

## What Changes
- 调整问题显示时机：问题英文句子读完后再显示选项界面
- 问题中文翻译改为答题后才显示
- 为考试资源添加API生成解析功能

## Impact
- Affected specs: 精听测验模块
- Affected code: 
  - `js/quiz-training.js` - 调整问题显示逻辑
  - `data/quiz/cet4-2025-06-1_questions.json` - 更新时间戳为问题读完后的时间

## ADDED Requirements

### Requirement: 问题显示时机优化
系统应在问题英文句子播放完毕后才显示选项界面。

#### Scenario: 问题播放完成
- **WHEN** 音频播放到问题结束时间点（endTime）
- **THEN** 系统暂停音频并显示选项界面
- **AND** 此时问题英文已完整播放

### Requirement: 中文翻译显示时机
系统应在用户答题后才显示问题的中文翻译。

#### Scenario: 答题前
- **WHEN** 用户尚未选择答案
- **THEN** 系统只显示问题英文文本
- **AND** 不显示中文翻译

#### Scenario: 答题后
- **WHEN** 用户选择答案后
- **THEN** 系统显示问题中文翻译
- **AND** 显示正确/错误结果

### Requirement: 考试资源解析生成
系统应为考试资源调用API生成选项解析。

#### Scenario: 答题后生成解析
- **WHEN** 用户答题后
- **THEN** 系统调用API生成该题的解析
- **AND** 解析内容包含：正确答案解释、错误选项分析
- **AND** 解析缓存到本地避免重复调用

## MODIFIED Requirements

### Requirement: 时间戳数据格式
时间戳应表示问题播放完毕的时间点，而非问题开始时间。

#### Scenario: 更新时间戳
- **WHEN** 更新JSON数据时
- **THEN** startTime和endTime表示问题句子的时间范围
- **AND** 选项显示时机为endTime之后

## REMOVED Requirements
无移除的需求。
