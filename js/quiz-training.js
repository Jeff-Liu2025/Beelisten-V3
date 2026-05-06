/**
 * 精听测验 - 训练页面
 * 模拟真实听力考试：先播放完整段落，再显示该段落所有题目
 */

import { parseSRT } from './utils/srtParser.js';
import { formatTime } from './utils/time.js';
import { smartSegment, formatSegmentDuration } from './utils/audio-segment.js';
import { generateOptions, loadExamQuestions, generateExplanation, generatePassageAnalysis } from './quiz-generator.js';
import Store from './store/index.js';
import { saveProgress, loadProgress, clearProgress, hasUnfinishedTraining } from './store/training-progress.js';

class QuizTraining {
    constructor() {
        this.audio = document.getElementById('trainingAudio');
        this.resource = null;
        this.allSubtitles = [];
        this.zhSubtitles = [];
        this.isPlaying = false;
        this.isExamResource = false;
        this.passages = [];
        this.currentPassageIndex = 0;
        this.currentPassage = null;
        this.currentQuestionIndex = 0;
        this.correctCount = 0;
        this.wrongCount = 0;
        this.wrongAnswers = [];
        this.hasAnswered = false;
        this.currentOptions = [];
        this.showingQuestions = false;
        
        this.init();
    }
    
    async init() {
        console.log('[QuizTraining] 初始化训练页面');
        
        const resourceData = sessionStorage.getItem('quizResource');
        if (!resourceData) {
            alert('请先选择一个训练资源');
            window.location.href = 'quiz-select.html';
            return;
        }
        
        this.resource = JSON.parse(resourceData);
        this.isExamResource = this.resource.category === 'exam' && this.resource.questionsFile;
        
        document.getElementById('trainingTitle').textContent = `🎯 ${this.resource.title}`;
        
        if (this.isExamResource) {
            await this.loadExamQuestionsData();
        } else {
            await this.loadSubtitles();
        }
        
        this.bindEvents();
        this.loadAudio();
        
        const startIndex = this.resource.startSegmentIndex;
        console.log('[QuizTraining] startSegmentIndex:', startIndex, '类型:', typeof startIndex);
        
        if (startIndex !== null && startIndex !== undefined) {
            this.startPassage(startIndex);
        } else {
            this.startPassage(0);
        }
        this.updateStats();
    }
    
    async loadSubtitles() {
        try {
            const enResponse = await fetch(`../%E5%90%AC%E5%8A%9B%E8%B5%84%E6%BA%90/${encodeURIComponent(this.resource.subtitleFile)}`);
            const enSrtContent = await enResponse.text();
            this.allSubtitles = parseSRT(enSrtContent);
            console.log('[QuizTraining] 英文字幕加载完成:', this.allSubtitles.length, '条');
        } catch (error) {
            console.error('[QuizTraining] 英文字幕加载失败:', error);
            this.allSubtitles = [];
        }
    }
    
    async loadExamQuestionsData() {
        try {
            console.log('[QuizTraining] 加载题目文件:', this.resource.questionsFile);
            const questionsData = await loadExamQuestions(this.resource.questionsFile);
            this.passages = questionsData.passages || [];
            console.log('[QuizTraining] 考试段落加载完成:', this.passages.length, '个段落');
            if (this.passages.length > 0) {
                console.log('[QuizTraining] 第一个段落:', this.passages[0].passageName);
            }
        } catch (error) {
            console.error('[QuizTraining] 考试题目加载失败:', error);
            this.passages = [];
        }
    }
    
    loadAudio() {
        if (!this.audio || !this.resource) return;
        
        const audioSrc = `../%E5%90%AC%E5%8A%9B%E8%B5%84%E6%BA%90/${encodeURIComponent(this.resource.audioFile)}`;
        console.log('[QuizTraining] 加载音频:', audioSrc);
        
        this.audio.src = audioSrc;
        this.audio.load();
        
        this.audio.addEventListener('timeupdate', () => this.onTimeUpdate());
        this.audio.addEventListener('ended', () => this.onAudioEnded());
        this.audio.addEventListener('loadedmetadata', () => {
            console.log('[QuizTraining] 音频元数据加载完成');
            this.updateTimeDisplay();
        });
        this.audio.addEventListener('error', (e) => {
            console.error('[QuizTraining] 音频加载错误:', e);
        });
    }
    
    startPassage(passageIndex) {
        console.log('[QuizTraining] startPassage called with index:', passageIndex, 'passages count:', this.passages.length);
        
        if (this.isExamResource && this.passages.length === 0) {
            console.error('[QuizTraining] 没有段落数据！题目可能加载失败');
            const container = document.getElementById('quizOptionsContainer');
            if (container) {
                container.innerHTML = `
                    <div class="error-message">
                        <div class="error-icon">⚠️</div>
                        <h3>题目加载失败</h3>
                        <p>请检查网络连接后刷新页面重试</p>
                        <button class="training-action-btn" onclick="window.location.reload()">刷新页面</button>
                    </div>
                `;
                container.classList.remove('hidden');
            }
            return;
        }
        
        const playerSection = document.querySelector('.training-player-section');
        if (playerSection) {
            playerSection.classList.remove('hidden');
        }
        
        const trainingActions = document.querySelector('.training-actions');
        if (trainingActions) {
            trainingActions.classList.remove('hidden');
        }
        
        if (this.isExamResource) {
            if (passageIndex >= this.passages.length) {
                console.log('[QuizTraining] passageIndex >= passages.length, showing final result');
                this.showFinalResult();
                return;
            }
            
            this.currentPassageIndex = passageIndex;
            this.currentPassage = this.passages[passageIndex];
            console.log('[QuizTraining] 当前段落:', this.currentPassage?.passageName, 'startTime:', this.currentPassage?.passageStartTime);
            
            this.currentQuestionIndex = 0;
            this.correctCount = 0;
            this.wrongCount = 0;
            this.wrongAnswers = [];
            this.showingQuestions = false;
            
            this.updateProgress();
            this.hideQuestionUI();
            this.startContinuousPlay();
            this.saveCurrentProgress();
        } else {
            this.startNonExamMode();
        }
    }
    
    saveCurrentProgress() {
        if (!this.resource || !this.passages.length) return;
        
        saveProgress(this.resource.id, {
            segmentIndex: this.currentPassageIndex,
            totalSegments: this.passages.length,
            currentSentence: this.currentQuestionIndex,
            correctCount: this.correctCount,
            wrongCount: this.wrongCount,
            mode: 'quiz-listen'
        });
    }
    
    startNonExamMode() {
        console.log('[QuizTraining] 非考试资源模式 - 不支持');
        
        const optionsContainer = document.getElementById('quizOptionsContainer');
        if (optionsContainer) {
            optionsContainer.innerHTML = `
                <div class="passage-complete-card">
                    <div class="passage-complete-hero">
                        <div class="hero-icon">⚠️</div>
                        <h3 class="hero-title">暂不支持</h3>
                        <p class="hero-subtitle">该资源暂不支持精听测验模式</p>
                    </div>
                    <div class="passage-actions">
                        <button class="passage-return-btn" onclick="window.location.href='quiz-select.html'">
                            <span class="btn-icon">←</span>
                            <span class="btn-text">返回选择</span>
                        </button>
                    </div>
                </div>
            `;
            optionsContainer.classList.remove('hidden');
        }
        
        const playerSection = document.querySelector('.training-player-section');
        if (playerSection) {
            playerSection.classList.add('hidden');
        }
    }
    
    startContinuousPlay() {
        console.log('[QuizTraining] startContinuousPlay called');
        console.log('[QuizTraining] audio:', this.audio ? 'exists' : 'null');
        console.log('[QuizTraining] currentPassage:', this.currentPassage ? this.currentPassage.passageName : 'null');
        console.log('[QuizTraining] audio src:', this.audio?.src);
        
        if (!this.audio || !this.currentPassage) {
            console.error('[QuizTraining] startContinuousPlay: audio or currentPassage is null');
            return;
        }
        
        this.showingQuestions = false;
        this.hasAnswered = false;
        
        const startTime = this.currentPassage.passageStartTime || 0;
        console.log('[QuizTraining] startTime:', startTime);
        
        const playWhenReady = () => {
            this.audio.currentTime = startTime;
            
            const playPromise = this.audio.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    console.log('[QuizTraining] 播放成功');
                    this.isPlaying = true;
                    this.updatePlayButton();
                    this.hideQuestionUI();
                    
                    const progressText = `${this.currentPassage.passageName} - 播放中...`;
                    document.getElementById('trainingProgress').textContent = progressText;
                }).catch(err => {
                    console.error('[QuizTraining] 播放失败:', err);
                });
            }
        };
        
        if (this.audio.readyState >= 2) {
            playWhenReady();
        } else {
            const onCanPlay = () => {
                this.audio.removeEventListener('canplay', onCanPlay);
                playWhenReady();
            };
            this.audio.addEventListener('canplay', onCanPlay);
        }
    }
    
    onTimeUpdate() {
        if (!this.audio) return;
        
        this.updateTimeDisplay();
        this.updateProgressBar();
        
        if (this.showingQuestions) return;
        
        const currentTime = this.audio.currentTime;
        
        if (this.currentPassage && currentTime >= this.currentPassage.passageEndTime - 5) {
            console.log(`[QuizTraining] onTimeUpdate: currentTime=${currentTime.toFixed(1)}, passageEndTime=${this.currentPassage.passageEndTime}, passageName=${this.currentPassage.passageName}`);
        }
        
        if (this.currentPassage && currentTime >= this.currentPassage.passageEndTime) {
            console.log('[QuizTraining] 达到passageEndTime，暂停并显示题目');
            this.audio.pause();
            this.isPlaying = false;
            this.updatePlayButton();
            this.showPassageQuestions();
        }
    }
    
    onAudioEnded() {
        this.isPlaying = false;
        this.updatePlayButton();
        
        if (!this.showingQuestions && this.currentPassage) {
            this.showPassageQuestions();
        }
    }
    
    showPassageQuestions() {
        console.log('[QuizTraining] showPassageQuestions called, passage:', this.currentPassage?.passageName, 'questions:', this.currentPassage?.questions?.length);
        
        this.showingQuestions = true;
        this.currentQuestionIndex = 0;
        
        const progressText = `${this.currentPassage.passageName} - 共 ${this.currentPassage.questions.length} 题`;
        document.getElementById('trainingProgress').textContent = progressText;
        
        this.showQuestion(0);
    }
    
    showQuestion(questionIndex) {
        console.log('[QuizTraining] showQuestion called with index:', questionIndex);
        
        if (questionIndex >= this.currentPassage.questions.length) {
            this.onPassageComplete();
            return;
        }
        
        this.currentQuestionIndex = questionIndex;
        const question = this.currentPassage.questions[questionIndex];
        
        console.log('[QuizTraining] 显示题目:', question.questionText);
        
        const progressText = `${this.currentPassage.passageName} | 第 ${questionIndex + 1}/${this.currentPassage.questions.length} 题`;
        document.getElementById('trainingProgress').textContent = progressText;
        
        const optionsList = document.getElementById('quizOptionsList');
        if (!optionsList) return;
        
        optionsList.innerHTML = `
            <div class="exam-question-header">
                <div class="exam-question-text">${question.questionText}</div>
            </div>
            <div class="exam-options-list">
                ${question.options.map((option, index) => `
                    <div class="quiz-option" data-index="${index}" data-correct="${option.correct}">
                        <span class="option-label">${option.label}</span>
                        <span class="option-text">${option.text}</span>
                    </div>
                `).join('')}
            </div>
        `;
        this.currentOptions = question.options;
        
        optionsList.querySelectorAll('.quiz-option').forEach(optionEl => {
            optionEl.addEventListener('click', () => {
                this.selectOption(optionEl);
            });
        });
        
        const optionsContainer = document.getElementById('quizOptionsContainer');
        if (optionsContainer) {
            optionsContainer.classList.remove('hidden');
        }
        
        const resultContainer = document.getElementById('quizResultContainer');
        if (resultContainer) {
            resultContainer.classList.add('hidden');
            resultContainer.innerHTML = '';
        }
    }
    
    hideQuestionUI() {
        const optionsContainer = document.getElementById('quizOptionsContainer');
        if (optionsContainer) {
            optionsContainer.classList.add('hidden');
        }
        
        const resultContainer = document.getElementById('quizResultContainer');
        if (resultContainer) {
            resultContainer.classList.add('hidden');
            resultContainer.innerHTML = '';
        }
    }
    
    async selectOption(optionEl) {
        const isCorrect = optionEl.dataset.correct === 'true';
        const selectedIndex = parseInt(optionEl.dataset.index);
        const question = this.currentPassage.questions[this.currentQuestionIndex];
        
        document.querySelectorAll('.quiz-option').forEach(el => {
            el.classList.add('disabled');
            if (el.dataset.correct === 'true') {
                el.classList.add('correct-answer');
            }
        });
        
        if (isCorrect) {
            optionEl.classList.add('selected-correct');
            this.correctCount++;
            this.playSound('correct');
            this.rewardHoneyCoins(10);
            await this.showResult(true, this.currentOptions[selectedIndex]?.text, null, question);
        } else {
            optionEl.classList.add('selected-wrong');
            this.wrongCount++;
            this.playSound('wrong');
            
            const correctOption = this.currentOptions.find(o => o.correct);
            this.wrongAnswers.push({
                passageName: this.currentPassage.passageName,
                questionNumber: question.questionNumber,
                question: question.questionText,
                selectedAnswer: this.currentOptions[selectedIndex]?.text,
                correctAnswer: correctOption?.text
            });
            
            await this.showResult(false, this.currentOptions[selectedIndex]?.text, correctOption?.text, question);
        }
        
        this.updateStats();
    }
    
    async showResult(isCorrect, selectedText, correctText = '', question = null) {
        const resultContainer = document.getElementById('quizResultContainer');
        if (!resultContainer) return;
        
        resultContainer.classList.remove('hidden');
        
        const questionZh = question?.questionTextZh || '';
        
        let explanation = '';
        if (this.isExamResource && question && !isCorrect) {
            try {
                explanation = await generateExplanation(
                    question.questionText,
                    correctText,
                    selectedText
                );
            } catch (e) {
                console.error('[QuizTraining] 解析生成失败:', e);
            }
        }
        
        if (isCorrect) {
            resultContainer.innerHTML = `
                <div class="quiz-result-message success">
                    <div class="result-icon">✅</div>
                    <div class="result-text">回答正确！</div>
                </div>
                ${questionZh ? `
                <div class="quiz-result-detail">
                    <div class="result-sentence">
                        <span class="result-label">题目翻译：</span>
                        <span class="result-content">${questionZh}</span>
                    </div>
                </div>
                ` : ''}
                <div class="result-actions-inline">
                    <button class="training-action-btn next-btn" id="nextQuestionBtn">
                        ${this.currentQuestionIndex < this.currentPassage.questions.length - 1 ? '下一题 →' : '完成本段'}
                    </button>
                </div>
            `;
        } else {
            resultContainer.innerHTML = `
                <div class="quiz-result-message error">
                    <div class="result-icon">❌</div>
                    <div class="result-text">回答错误</div>
                </div>
                <div class="quiz-result-detail">
                    <div class="result-answer">
                        <span class="result-label">你选的：</span>
                        <span class="result-content wrong">${selectedText}</span>
                    </div>
                    <div class="result-answer">
                        <span class="result-label">正确的：</span>
                        <span class="result-content correct">${correctText}</span>
                    </div>
                    ${questionZh ? `
                    <div class="result-sentence">
                        <span class="result-label">题目翻译：</span>
                        <span class="result-content">${questionZh}</span>
                    </div>
                    ` : ''}
                    ${explanation ? `
                    <div class="result-explanation">
                        <span class="result-label">解析：</span>
                        <span>${explanation}</span>
                    </div>
                    ` : ''}
                </div>
                <div class="result-actions-inline">
                    <button class="training-action-btn next-btn" id="nextQuestionBtn">
                        ${this.currentQuestionIndex < this.currentPassage.questions.length - 1 ? '下一题 →' : '完成本段'}
                    </button>
                </div>
            `;
        }
        
        const nextBtn = document.getElementById('nextQuestionBtn');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.nextQuestion();
            });
        }
    }
    
    nextQuestion() {
        this.currentQuestionIndex++;
        
        if (this.currentQuestionIndex >= this.currentPassage.questions.length) {
            this.onPassageComplete();
        } else {
            this.showQuestion(this.currentQuestionIndex);
        }
    }
    
    onPassageComplete() {
        console.log('[QuizTraining] 段落完成:', this.currentPassage.passageName);
        
        const playerSection = document.querySelector('.training-player-section');
        if (playerSection) {
            playerSection.classList.add('hidden');
        }
        
        const resultContainer = document.getElementById('quizResultContainer');
        if (resultContainer) {
            resultContainer.classList.add('hidden');
            resultContainer.innerHTML = '';
        }
        
        const trainingActions = document.querySelector('.training-actions');
        if (trainingActions) {
            trainingActions.classList.add('hidden');
        }
        
        const total = this.correctCount + this.wrongCount;
        const accuracy = total > 0 ? Math.round((this.correctCount / total) * 100) : 0;
        
        let performanceIcon = '🎯';
        let performanceText = '继续加油！';
        if (accuracy >= 90) {
            performanceIcon = '🏆';
            performanceText = '太棒了！完美表现！';
        } else if (accuracy >= 70) {
            performanceIcon = '🌟';
            performanceText = '表现优秀！继续保持！';
        } else if (accuracy >= 50) {
            performanceIcon = '💪';
            performanceText = '不错的尝试，还能更好！';
        }
        
        const optionsContainer = document.getElementById('quizOptionsContainer');
        if (optionsContainer) {
            optionsContainer.innerHTML = `
                <div class="passage-complete-card">
                    <div class="passage-complete-hero">
                        <div class="hero-icon">${performanceIcon}</div>
                        <h3 class="hero-title">${this.currentPassage.passageName}</h3>
                        <p class="hero-subtitle">${performanceText}</p>
                    </div>
                    
                    <div class="passage-stats-ring">
                        <div class="ring-container">
                            <svg class="accuracy-ring" viewBox="0 0 120 120">
                                <circle class="ring-bg" cx="60" cy="60" r="50" />
                                <circle class="ring-progress" cx="60" cy="60" r="50" 
                                    style="stroke-dasharray: ${accuracy * 3.14} 314; 
                                           stroke: ${accuracy >= 70 ? '#27ae60' : accuracy >= 50 ? '#d4ac38' : '#c0392b'}" />
                            </svg>
                            <div class="ring-center">
                                <span class="ring-value">${accuracy}%</span>
                                <span class="ring-label">正确率</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="passage-stats-row">
                        <div class="stat-pill correct">
                            <span class="pill-icon">✓</span>
                            <span class="pill-value">${this.correctCount}</span>
                            <span class="pill-label">正确</span>
                        </div>
                        <div class="stat-pill wrong">
                            <span class="pill-icon">✗</span>
                            <span class="pill-value">${this.wrongCount}</span>
                            <span class="pill-label">错误</span>
                        </div>
                        <div class="stat-pill total">
                            <span class="pill-icon">📋</span>
                            <span class="pill-value">${total}</span>
                            <span class="pill-label">总题数</span>
                        </div>
                    </div>
                    
                    <div class="passage-analysis-section" id="passageAnalysisSection">
                        <div class="analysis-loading">
                            <div class="loading-spinner"></div>
                            <span>正在生成智能分析...</span>
                        </div>
                    </div>
                    
                    <div class="passage-actions">
                        <button class="passage-return-btn" id="backToSelectBtn">
                            <span class="btn-icon">←</span>
                            <span class="btn-text">返回资源选择</span>
                        </button>
                    </div>
                </div>
            `;
            optionsContainer.classList.remove('hidden');
        }
        
        this.generateAndShowAnalysis();
        
        const backToSelectBtn = document.getElementById('backToSelectBtn');
        if (backToSelectBtn) {
            backToSelectBtn.addEventListener('click', () => {
                window.location.href = 'quiz-select.html';
            });
        }
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
                if (analysis) {
                    analysisSection.innerHTML = `
                        <div class="analysis-header">📊 智能答题分析</div>
                        <div class="analysis-content">${analysis}</div>
                    `;
                } else {
                    analysisSection.innerHTML = `
                        <div class="analysis-header">📊 答题分析</div>
                        <div class="analysis-content">本段正确 ${this.correctCount} 题，错误 ${this.wrongCount} 题，正确率 ${this.correctCount + this.wrongCount > 0 ? Math.round((this.correctCount / (this.correctCount + this.wrongCount)) * 100) : 0}%</div>
                    `;
                }
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
    
    showFinalResult() {
        document.getElementById('quizTrainingPage').classList.add('hidden');
        document.getElementById('quizResultPage').classList.remove('hidden');
        
        const total = this.correctCount + this.wrongCount;
        const accuracy = total > 0 ? Math.round((this.correctCount / total) * 100) : 0;
        
        document.getElementById('finalCorrect').textContent = this.correctCount;
        document.getElementById('finalWrong').textContent = this.wrongCount;
        document.getElementById('finalAccuracy').textContent = `${accuracy}%`;
        
        const wrongSection = document.getElementById('wrongAnswersSection');
        const wrongList = document.getElementById('wrongAnswersList');
        
        if (this.wrongAnswers.length === 0) {
            wrongSection.classList.add('hidden');
        } else {
            wrongSection.classList.remove('hidden');
            wrongList.innerHTML = this.wrongAnswers.map((item, index) => `
                <div class="wrong-answer-item">
                    <div class="wrong-answer-header">
                        <span class="wrong-answer-index">❌ ${item.passageName} - 第${item.questionNumber}题</span>
                    </div>
                    <div class="wrong-answer-content">
                        <div class="wrong-answer-sentence">
                            <span class="result-label">题目：</span>
                            <span>${item.question}</span>
                        </div>
                        <div class="wrong-answer-selected">
                            <span class="result-label">你选的：</span>
                            <span class="wrong">${item.selectedAnswer}</span>
                        </div>
                        <div class="wrong-answer-correct">
                            <span class="result-label">正确的：</span>
                            <span class="correct">${item.correctAnswer}</span>
                        </div>
                    </div>
                </div>
            `).join('');
        }
        
        clearProgress(this.resource.id, 'quiz-listen');
        this.saveQuizStats();
    }
    
    bindEvents() {
        const playPauseBtn = document.getElementById('playPauseBtn');
        if (playPauseBtn) {
            playPauseBtn.addEventListener('click', () => this.togglePlay());
        }
        
        const replayBtn = document.getElementById('replayBtn');
        if (replayBtn) {
            replayBtn.addEventListener('click', () => this.replayPassage());
        }
        
        const retryWrongBtn = document.getElementById('retryWrongBtn');
        if (retryWrongBtn) {
            retryWrongBtn.addEventListener('click', () => this.retryWrongAnswers());
        }
        
        const menuItems = document.querySelectorAll('.menu-item');
        menuItems.forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.page;
                if (page === 'learn') {
                    window.location.href = 'index.html';
                } else if (page === 'review') {
                    window.location.href = 'index.html#page=review';
                } else {
                    window.location.href = 'index.html';
                }
            });
        });
        
        const volumeSlider = document.getElementById('volumeSlider');
        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => {
                const volume = e.target.value / 100;
                this.audio.volume = volume;
                this.updateVolumeIcon(volume);
            });
        }
        
        const volumeBtn = document.getElementById('volumeBtn');
        if (volumeBtn) {
            volumeBtn.addEventListener('click', () => this.toggleMute());
        }
    }
    
    updateVolumeIcon(volume) {
        const volumeBtn = document.getElementById('volumeBtn');
        if (!volumeBtn) return;
        
        const icon = volumeBtn.querySelector('i');
        if (!icon) return;
        
        if (volume === 0) {
            icon.className = 'ph ph-speaker-x';
        } else if (volume < 0.5) {
            icon.className = 'ph ph-speaker-low';
        } else {
            icon.className = 'ph ph-speaker-high';
        }
    }
    
    toggleMute() {
        const volumeSlider = document.getElementById('volumeSlider');
        if (!volumeSlider) return;
        
        if (this.audio.volume > 0) {
            this.previousVolume = this.audio.volume;
            this.audio.volume = 0;
            volumeSlider.value = 0;
        } else {
            this.audio.volume = this.previousVolume || 1;
            volumeSlider.value = (this.previousVolume || 1) * 100;
        }
        this.updateVolumeIcon(this.audio.volume);
    }
    
    togglePlay() {
        if (!this.audio) return;
        
        if (this.isPlaying) {
            this.audio.pause();
            this.isPlaying = false;
        } else {
            if (!this.showingQuestions) {
                this.audio.play();
                this.isPlaying = true;
            }
        }
        
        this.updatePlayButton();
    }
    
    replayPassage() {
        this.showingQuestions = false;
        this.currentQuestionIndex = 0;
        this.hideQuestionUI();
        this.startContinuousPlay();
    }
    
    updatePlayButton() {
        const btn = document.getElementById('playPauseBtn');
        if (btn) {
            btn.innerHTML = this.isPlaying ? 
                '<i class="ph ph-pause"></i> 暂停' : 
                '<i class="ph ph-play"></i> 播放';
        }
    }
    
    updateTimeDisplay() {
        const display = document.getElementById('timeDisplay');
        if (!display || !this.audio) return;
        
        const current = formatTime(this.audio.currentTime);
        const duration = formatTime(this.audio.duration || 0);
        display.textContent = `${current} / ${duration}`;
    }
    
    updateProgressBar() {
        const filled = document.getElementById('progressFilled');
        if (!filled || !this.audio || !this.audio.duration) return;
        
        const progress = (this.audio.currentTime / this.audio.duration) * 100;
        filled.style.width = `${progress}%`;
    }
    
    updateProgress() {
        const progress = document.getElementById('trainingProgress');
        const stat = document.getElementById('progressStat');
        
        if (this.currentPassage) {
            const current = this.currentPassageIndex + 1;
            const total = this.passages.length;
            
            if (progress) progress.textContent = `${this.currentPassage.passageName}`;
            if (stat) stat.textContent = `${current}/${total}`;
        }
    }
    
    updateStats() {
        const correctEl = document.getElementById('correctStat');
        const wrongEl = document.getElementById('wrongStat');
        
        if (correctEl) correctEl.textContent = this.correctCount;
        if (wrongEl) wrongEl.textContent = this.wrongCount;
    }
    
    retryWrongAnswers() {
        if (this.wrongAnswers.length === 0) return;
        
        this.passages = [{
            passageId: 'wrong-answers',
            passageName: '错题重练',
            passageEndTime: 0,
            questions: this.wrongAnswers.map(w => ({
                questionNumber: w.questionNumber,
                questionText: w.question,
                questionTextZh: '',
                options: [
                    { label: 'A', text: w.selectedAnswer, correct: false },
                    { label: 'B', text: w.correctAnswer, correct: true },
                    { label: 'C', text: '选项待补充', correct: false },
                    { label: 'D', text: '选项待补充', correct: false }
                ]
            }))
        }];
        
        this.correctCount = 0;
        this.wrongCount = 0;
        this.wrongAnswers = [];
        
        document.getElementById('quizResultPage').classList.add('hidden');
        document.getElementById('quizTrainingPage').classList.remove('hidden');
        
        this.showingQuestions = true;
        this.showQuestion(0);
        this.updateStats();
    }
    
    playSound(type) {
        try {
            const sound = new Audio(type === 'correct' ? 
                '../按键提示音效/答对提示音.mp3' : 
                '../按键提示音效/打错提示音.mp3'
            );
            sound.volume = 0.5;
            sound.play().catch(() => {});
        } catch (e) {}
    }
    
    rewardHoneyCoins(amount) {
        try {
            Store.addHoneyCoins(amount);
            console.log('[QuizTraining] 奖励蜂蜜币:', amount);
        } catch (error) {
            console.error('[QuizTraining] 奖励蜂蜜币失败:', error);
        }
    }
    
    saveQuizStats() {
        try {
            const statsKey = 'beelisten-quiz-stats';
            const raw = localStorage.getItem(statsKey);
            const stats = raw ? JSON.parse(raw) : {};
            
            if (!stats[this.resource.id]) {
                stats[this.resource.id] = {
                    history: [],
                    bestAccuracy: 0,
                    totalPlays: 0
                };
            }
            
            const total = this.correctCount + this.wrongCount;
            const accuracy = total > 0 ? this.correctCount / total : 0;
            
            stats[this.resource.id].history.push({
                date: new Date().toISOString().split('T')[0],
                total: total,
                correct: this.correctCount,
                wrongSentences: this.wrongAnswers.map(w => w.questionNumber),
                duration: 0
            });
            
            if (accuracy > stats[this.resource.id].bestAccuracy) {
                stats[this.resource.id].bestAccuracy = accuracy;
            }
            
            stats[this.resource.id].totalPlays++;
            
            localStorage.setItem(statsKey, JSON.stringify(stats));
        } catch (e) {
            console.error('[QuizTraining] 保存统计失败:', e);
        }
    }
}

const trainingPage = new QuizTraining();
export default trainingPage;
