# Tasks

## Task 1: 创建真题选项JSON数据结构
- [x] Task 1.1: 设计JSON数据格式（包含题目序号、选项、正确答案、解析字段）
- [x] Task 1.2: 创建 `data/quiz/cet4_2025_06_1_questions.json` 文件（虚拟占位数据）
- [x] Task 1.3: 更新 `js/podcasts-data.js` 为考试资源添加 `questionsFile` 字段

## Task 2: 更新资源选择页面添加分段功能
- [x] Task 2.1: 修改 `quiz-select.html` 添加分段显示UI结构
- [x] Task 2.2: 修改 `js/quiz-select.js` 实现分段展开/收起逻辑
- [x] Task 2.3: 实现考试资源的分段解析（按Section/News Report分组）
- [x] Task 2.4: 添加分段点击跳转到训练页面的功能

## Task 3: 更新训练页面支持考试资源
- [x] Task 3.1: 修改 `js/quiz-training.js` 区分考试/非考试资源
- [x] Task 3.2: 实现从srt提取题目文本和时间戳的功能
- [x] Task 3.3: 实现从JSON文件加载选项数据的功能
- [x] Task 3.4: 实现虚拟占位选项显示（选项待补充）
- [x] Task 3.5: 实现API生成解析功能

## Task 4: 更新quiz-generator模块
- [x] Task 4.1: 添加 `loadExamQuestions()` 函数加载真题选项
- [x] Task 4.2: 添加 `generateExplanation()` 函数生成解析
- [x] Task 4.3: 修改 `generateOptions()` 支持区分资源类型

## Task 5: 测试与验证
- [x] Task 5.1: 测试考试资源分段显示功能
- [x] Task 5.2: 测试考试资源题目展示（时间戳、题目文本）
- [x] Task 5.3: 测试虚拟占位选项显示
- [x] Task 5.4: 测试非考试资源保持原有API生成逻辑

# Task Dependencies
- Task 2 依赖 Task 1.1（需要知道数据结构）
- Task 3 依赖 Task 1（需要JSON数据格式）和 Task 4（需要加载函数）
- Task 5 依赖 Task 1-4 全部完成
