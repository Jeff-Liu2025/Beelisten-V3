# 精听测验分段完成界面优化计划

## 需求概述
在精听测验模式中，完成每一段的精听后：
1. 显示本分段的练习数据（正确数、错误数、正确率等）
2. 添加智能答题分析（通过调用API完成）
3. 隐藏播放栏（div.training-player-section）
4. 保留返回资源选择页面的按钮

## 当前代码分析

### 相关文件
- `js/quiz-training.js` - 精听测验训练逻辑
- `quiz-training.html` - 精听测验HTML结构
- `js/quiz-generator.js` - API调用相关函数
- `css/training-quiz.css` - 精听测验样式

### 关键代码位置
- `onPassageComplete()` 方法（quiz-training.js 第430-464行）- 处理段落完成后的逻辑
- `generateExplanation()` 函数（quiz-generator.js）- 可复用的API调用
- `.training-player-section` 元素 - 需要隐藏的播放栏

## 实现步骤

### 步骤1：修改 `onPassageComplete()` 方法
**文件**: `js/quiz-training.js`

修改段落完成后的显示逻辑：
- 隐藏播放栏 `.training-player-section`
- 显示详细的分段练习数据
- 添加智能答题分析调用
- 添加返回资源选择页面按钮

### 步骤2：添加智能答题分析API函数
**文件**: `js/quiz-generator.js`

新增 `generatePassageAnalysis()` 函数：
- 输入：段落名称、正确数、错误数、错题列表
- 输出：智能分析文本
- 使用DeepSeek API生成个性化学习建议

### 步骤3：更新HTML结构
**文件**: `quiz-training.html`

分段完成界面需要包含：
- 分段完成标题
- 练习数据统计（正确数、错误数、正确率）
- 智能答题分析区域（加载中/分析结果）
- 操作按钮（下一段落/返回选择）

### 步骤4：添加CSS样式
**文件**: `css/training-quiz.css`

新增分段完成界面样式：
- `.passage-complete-card` - 完成卡片容器
- `.passage-stats-grid` - 统计数据网格
- `.passage-analysis-section` - 智能分析区域
- `.passage-analysis-loading` - 加载状态样式

## 详细实现

### 1. quiz-generator.js 新增函数

```javascript
export async function generatePassageAnalysis(passageName, correctCount, wrongCount, wrongAnswers) {
    // 计算正确率
    const total = correctCount + wrongCount;
    const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    
    // 构建错题摘要
    const wrongSummary = wrongAnswers.map(w => 
        `题目${w.questionNumber}: ${w.question} (选了: ${w.selectedAnswer}, 正确: ${w.correctAnswer})`
    ).join('\n');
    
    const prompt = `请分析以下英语听力测验结果，给出简洁的学习建议：

段落：${passageName}
总题数：${total}
正确：${correctCount}
错误：${wrongCount}
正确率：${accuracy}%

错题详情：
${wrongSummary || '无错题'}

请用中文给出：
1. 整体表现评价（一句话）
2. 错题原因分析（如有错题）
3. 改进建议（1-2条）

总字数不超过150字。`;

    // 调用API...
}
```

### 2. quiz-training.js 修改

```javascript
async onPassageComplete() {
    // 隐藏播放栏
    const playerSection = document.querySelector('.training-player-section');
    if (playerSection) {
        playerSection.classList.add('hidden');
    }
    
    // 计算统计数据
    const total = this.correctCount + this.wrongCount;
    const accuracy = total > 0 ? Math.round((this.correctCount / total) * 100) : 0;
    
    // 显示分段完成界面
    const optionsContainer = document.getElementById('quizOptionsContainer');
    if (optionsContainer) {
        optionsContainer.innerHTML = `
            <div class="passage-complete-card">
                <div class="passage-complete-header">
                    <span class="complete-icon">🎉</span>
                    <h3>${this.currentPassage.passageName} 完成！</h3>
                </div>
                
                <div class="passage-stats-grid">
                    <div class="stat-box correct">
                        <span class="stat-num">${this.correctCount}</span>
                        <span class="stat-label">正确</span>
                    </div>
                    <div class="stat-box wrong">
                        <span class="stat-num">${this.wrongCount}</span>
                        <span class="stat-label">错误</span>
                    </div>
                    <div class="stat-box accuracy">
                        <span class="stat-num">${accuracy}%</span>
                        <span class="stat-label">正确率</span>
                    </div>
                </div>
                
                <div class="passage-analysis-section" id="passageAnalysisSection">
                    <div class="analysis-loading">
                        <div class="loading-spinner"></div>
                        <span>正在生成智能分析...</span>
                    </div>
                </div>
                
                <div class="passage-actions">
                    <button class="training-action-btn secondary" onclick="window.location.href='quiz-select.html'">
                        ← 返回选择
                    </button>
                    ${this.currentPassageIndex < this.passages.length - 1 ? `
                    <button class="training-action-btn next-btn" id="nextPassageBtn">
                        下一段落 →
                    </button>
                    ` : `
                    <button class="training-action-btn next-btn" id="showResultBtn">
                        查看总结果
                    </button>
                    `}
                </div>
            </div>
        `;
        optionsContainer.classList.remove('hidden');
    }
    
    // 异步生成智能分析
    this.generateAndShowAnalysis();
    
    // 绑定按钮事件...
}

async generateAndShowAnalysis() {
    try {
        const analysis = await generatePassageAnalysis(
            this.currentPassage.passageName,
            this.correctCount,
            this.wrongCount,
            this.wrongAnswers
        );
        
        const analysisSection = document.getElementById('passageAnalysisSection');
        if (analysisSection) {
            analysisSection.innerHTML = `
                <div class="analysis-header">📊 智能答题分析</div>
                <div class="analysis-content">${analysis}</div>
            `;
        }
    } catch (error) {
        console.error('[QuizTraining] 分析生成失败:', error);
        const analysisSection = document.getElementById('passageAnalysisSection');
        if (analysisSection) {
            analysisSection.innerHTML = `
                <div class="analysis-header">📊 答题分析</div>
                <div class="analysis-content">分析生成失败，请稍后重试</div>
            `;
        }
    }
}
```

### 3. training-quiz.css 新增样式

```css
.passage-complete-card {
    background: rgba(255, 255, 255, 0.95);
    border-radius: 15px;
    padding: 30px;
    text-align: center;
    border: 1px solid rgba(212, 172, 56, 0.2);
    box-shadow: 0 4px 15px rgba(212, 172, 56, 0.1);
}

.passage-complete-header {
    margin-bottom: 25px;
}

.passage-complete-header .complete-icon {
    font-size: 48px;
    display: block;
    margin-bottom: 10px;
}

.passage-complete-header h3 {
    color: #5d4e37;
    font-size: 22px;
}

.passage-stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 15px;
    margin-bottom: 25px;
}

.stat-box {
    background: rgba(254, 249, 231, 0.6);
    border-radius: 12px;
    padding: 20px 15px;
}

.stat-box .stat-num {
    display: block;
    font-size: 28px;
    font-weight: 700;
    margin-bottom: 5px;
}

.stat-box.correct .stat-num { color: #27ae60; }
.stat-box.wrong .stat-num { color: #c0392b; }
.stat-box.accuracy .stat-num { color: #d4ac38; }

.stat-box .stat-label {
    font-size: 13px;
    color: #8b7355;
}

.passage-analysis-section {
    background: rgba(254, 249, 231, 0.4);
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 25px;
    text-align: left;
}

.analysis-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    color: #8b7355;
}

.analysis-header {
    font-weight: 600;
    color: #5d4e37;
    margin-bottom: 12px;
    font-size: 15px;
}

.analysis-content {
    color: #5d4e37;
    line-height: 1.7;
    font-size: 14px;
}

.passage-actions {
    display: flex;
    gap: 15px;
    justify-content: center;
    flex-wrap: wrap;
}
```

## 文件修改清单

| 文件 | 修改内容 |
|------|----------|
| `js/quiz-training.js` | 修改 `onPassageComplete()` 方法，添加 `generateAndShowAnalysis()` 方法 |
| `js/quiz-generator.js` | 新增 `generatePassageAnalysis()` 函数 |
| `css/training-quiz.css` | 新增分段完成界面相关样式 |

## 测试要点

1. 完成一段精听后，播放栏应隐藏
2. 分段完成界面显示正确的统计数据
3. 智能分析能正常生成并显示
4. "返回选择"按钮能正确跳转到 quiz-select.html
5. "下一段落"按钮能正确进入下一段
6. 最后一段完成后显示"查看总结果"按钮
