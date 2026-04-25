# Tasks

## Phase 1: 基础设施 - 进度保存与分段功能

- [x] Task 1: 创建训练进度存储模块
  - [x] SubTask 1.1: 创建 `js/store/training-progress.js` 进度存储模块
  - [x] SubTask 1.2: 实现进度保存功能 (saveProgress)
  - [x] SubTask 1.3: 实现进度恢复功能 (loadProgress)
  - [x] SubTask 1.4: 实现进度清除功能 (clearProgress)

- [x] Task 2: 实现音频分段功能
  - [x] SubTask 2.1: 创建 `js/utils/audio-segment.js` 分段工具
  - [x] SubTask 2.2: 实现智能分段逻辑（识别Section/News report/Conversation/Passage标记）
  - [x] SubTask 2.3: 实现普通分段逻辑（按句子数量分组）
  - [x] SubTask 2.4: 实现分段UI组件（显示分段列表）
  - [x] SubTask 2.5: 更新训练选择页面支持分段选择

## Phase 2: 优化现有词块填空训练

- [x] Task 3: 词块填空训练支持分段和进度保存
  - [x] SubTask 3.1: 更新 `js/word-fill-training.js` 支持分段训练
  - [x] SubTask 3.2: 添加进度保存钩子
  - [x] SubTask 3.3: 添加进度恢复提示UI
  - [x] SubTask 3.4: 更新训练完成页面显示统计

## Phase 3: 新训练模式

- [ ] Task 4: 听力选择训练模式
  - [ ] SubTask 4.1: 创建 `htlm/listening-choice.html` 选择训练页面
  - [ ] SubTask 4.2: 创建 `js/training/listening-choice.js` 选择训练逻辑
  - [ ] SubTask 4.3: 实现选择题自动生成算法
  - [ ] SubTask 4.4: 添加选择题样式到 `css/training.css`

- [ ] Task 5: 听写训练模式
  - [ ] SubTask 5.1: 创建 `htlm/dictation.html` 听写训练页面
  - [ ] SubTask 5.2: 创建 `js/training/dictation.js` 听写训练逻辑
  - [ ] SubTask 5.3: 实现输入对比和高亮差异功能
  - [ ] SubTask 5.4: 添加提示功能

- [ ] Task 6: 跟读训练模式
  - [ ] SubTask 6.1: 创建 `htlm/shadowing.html` 跟读训练页面
  - [ ] SubTask 6.2: 创建 `js/training/shadowing.js` 跟读训练逻辑
  - [ ] SubTask 6.3: 实现录音功能 (Web Audio API)
  - [ ] SubTask 6.4: 实现发音评分（可选：接入第三方API）

## Phase 4: 统计与UI优化

- [ ] Task 7: 训练统计系统
  - [ ] SubTask 7.1: 创建 `js/store/statistics.js` 统计存储模块
  - [ ] SubTask 7.2: 更新"个人档案"页面显示训练统计
  - [ ] SubTask 7.3: 添加训练历史记录功能

- [ ] Task 8: 更新训练选择页面
  - [ ] SubTask 8.1: 更新 `htlm/word-fill-select.html` 显示分段信息
  - [ ] SubTask 8.2: 添加训练模式选择入口
  - [ ] SubTask 8.3: 添加进度恢复提示

## Task Dependencies
- [Task 3] depends on [Task 1, Task 2]
- [Task 4] depends on [Task 1, Task 2]
- [Task 5] depends on [Task 1, Task 2]
- [Task 6] depends on [Task 1, Task 2]
- [Task 7] depends on [Task 3, Task 4, Task 5, Task 6]
- [Task 8] depends on [Task 2]
