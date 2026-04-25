/**
 * 词块填空训练 - 训练页面
 * 实现音频同步的词块填空训练功能，支持分段和进度保存
 */

import { parseSRT } from './utils/srtParser.js';
import { formatTime } from './utils/time.js';
import { smartSegment, formatSegmentDuration } from './utils/audio-segment.js';
import { saveProgress, loadProgress, clearProgress, hasUnfinishedTraining } from './store/training-progress.js';
import Store from './store/index.js';

class WordFillTraining {
    constructor() {
        this.audio = document.getElementById('trainingAudio');
        this.resource = null;
        this.allSubtitles = [];
        this.zhSubtitles = [];
        this.segments = [];
        this.currentSegment = null;
        this.currentSegmentIndex = 0;
        this.currentSentenceIndex = 0;
        this.correctCount = 0;
        this.wrongCount = 0;
        this.currentBlanks = [];
        this.answers = {};
        this.isPlaying = false;
        this.sentencePaused = false;
        this.sentenceEndTime = null;
        this.translationVisible = false;
        this.currentTranslation = null;
        this.activeDoublePoints = false;
        this.usedHintCard = false;
        
        this.stopWords = [
            'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
            'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
            'should', 'may', 'might', 'must', 'shall', 'can', 'to', 'of', 'in',
            'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through',
            'during', 'before', 'after', 'above', 'below', 'between', 'under',
            'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where',
            'why', 'how', 'all', 'each', 'few', 'more', 'most', 'other', 'some',
            'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than',
            'too', 'very', 'just', 'i', 'me', 'my', 'myself', 'we', 'our', 'ours',
            'you', 'your', 'yours', 'he', 'him', 'his', 'she', 'her', 'hers',
            'it', 'its', 'they', 'them', 'their', 'this', 'that', 'these', 'those'
        ];
        
        this.init();
    }
    
    async init() {
        console.log('[WordFillTraining] 初始化训练页面');
        
        const resourceData = sessionStorage.getItem('wordFillResource');
        if (!resourceData) {
            alert('请先选择一个训练资源');
            window.location.href = 'word-fill-select.html';
            return;
        }
        
        this.resource = JSON.parse(resourceData);
        document.getElementById('trainingTitle').textContent = `✍️ ${this.resource.title}`;
        
        await this.loadSubtitles();
        this.initSegments();
        this.bindEvents();
        this.loadAudio();
        
        // 检查是否继续训练
        if (this.resource.continueProgress) {
            this.restoreProgress();
        } else if (this.resource.startSegmentIndex !== null) {
            this.startSegment(this.resource.startSegmentIndex);
        } else {
            this.startSegment(0);
        }
        
        this.updateStats();
    }
    
    /**
     * 加载字幕文件
     */
    async loadSubtitles() {
        try {
            const enResponse = await fetch(`../听力资源/${this.resource.subtitleFile}`);
            const enSrtContent = await enResponse.text();
            this.allSubtitles = parseSRT(enSrtContent);
            console.log('[WordFillTraining] 英文字幕加载完成:', this.allSubtitles.length, '条');
        } catch (error) {
            console.error('[WordFillTraining] 英文字幕加载失败:', error);
            this.allSubtitles = [];
        }
        
        if (this.resource.subtitleFileZh) {
            try {
                const zhResponse = await fetch(`../听力资源/${this.resource.subtitleFileZh}`);
                const zhSrtContent = await zhResponse.text();
                this.zhSubtitles = parseSRT(zhSrtContent);
                console.log('[WordFillTraining] 中文字幕加载完成:', this.zhSubtitles.length, '条');
            } catch (error) {
                console.error('[WordFillTraining] 中文字幕加载失败:', error);
                this.zhSubtitles = [];
            }
        }
    }
    
    /**
     * 初始化分段
     */
    initSegments() {
        this.segments = smartSegment(this.allSubtitles);
        console.log('[WordFillTraining] 分段完成:', this.segments.length, '个分段');
        
        // 更新分段选择UI
        this.renderSegmentSelector();
    }
    
    /**
     * 渲染分段选择器
     */
    renderSegmentSelector() {
        const selectorEl = document.getElementById('segmentSelector');
        if (!selectorEl) return;
        
        selectorEl.innerHTML = this.segments.map((seg, index) => `
            <div class="segment-tab ${index === this.currentSegmentIndex ? 'active' : ''}" 
                 data-segment-index="${index}">
                <span class="segment-tab-name">${seg.name}</span>
                <span class="segment-tab-duration">${formatSegmentDuration(seg.duration)}</span>
            </div>
        `).join('');
        
        // 绑定点击事件
        selectorEl.querySelectorAll('.segment-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const index = parseInt(tab.dataset.segmentIndex);
                this.startSegment(index);
            });
        });
    }
    
    /**
     * 开始指定分段的训练
     */
    startSegment(segmentIndex) {
        if (segmentIndex >= this.segments.length) {
            this.showTrainingComplete();
            return;
        }
        
        this.currentSegmentIndex = segmentIndex;
        this.currentSegment = this.segments[segmentIndex];
        this.currentSentenceIndex = 0;
        this.correctCount = 0;
        this.wrongCount = 0;
        
        // 更新分段选择器高亮
        document.querySelectorAll('.segment-tab').forEach((tab, index) => {
            tab.classList.toggle('active', index === segmentIndex);
        });
        
        // 更新进度显示
        this.updateProgress();
        
        // 显示当前句子
        this.showCurrentSentence();
        
        // 保存进度
        this.saveCurrentProgress();
    }
    
    /**
     * 恢复训练进度
     */
    restoreProgress() {
        const progress = loadProgress(this.resource.id);
        
        if (progress) {
            this.currentSegmentIndex = progress.segmentIndex || 0;
            this.correctCount = progress.correctCount || 0;
            this.wrongCount = progress.wrongCount || 0;
            
            console.log('[WordFillTraining] 恢复进度: 分段', this.currentSegmentIndex);
            
            this.startSegment(this.currentSegmentIndex);
        } else {
            this.startSegment(0);
        }
    }
    
    /**
     * 保存当前进度
     */
    saveCurrentProgress() {
        saveProgress(this.resource.id, {
            segmentIndex: this.currentSegmentIndex,
            totalSegments: this.segments.length,
            currentSentence: this.currentSentenceIndex,
            correctCount: this.correctCount,
            wrongCount: this.wrongCount,
            mode: 'word-fill'
        });
    }
    
    /**
     * 加载音频
     */
    loadAudio() {
        if (!this.audio || !this.resource) return;
        
        this.audio.src = `../听力资源/${this.resource.audioFile}`;
        this.audio.load();
        
        this.audio.addEventListener('timeupdate', () => this.onTimeUpdate());
        this.audio.addEventListener('ended', () => this.onAudioEnded());
        this.audio.addEventListener('loadedmetadata', () => this.updateTimeDisplay());
    }
    
    /**
     * 绑定事件
     */
    bindEvents() {
        const playPauseBtn = document.getElementById('playPauseBtn');
        if (playPauseBtn) {
            playPauseBtn.addEventListener('click', () => this.togglePlay());
        }
        
        const replayBtn = document.getElementById('replayBtn');
        if (replayBtn) {
            replayBtn.addEventListener('click', () => this.replayCurrent());
        }
        
        const checkBtn = document.getElementById('checkAnswerBtn');
        if (checkBtn) {
            checkBtn.addEventListener('click', () => this.checkAnswers());
        }
        
        const nextBtn = document.getElementById('nextSentenceBtn');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextSentence());
        }
        
        const resetBtn = document.getElementById('resetBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetCurrent());
        }
        
        const showTranslationBtn = document.getElementById('showTranslationBtn');
        if (showTranslationBtn) {
            showTranslationBtn.addEventListener('click', () => this.toggleTranslation());
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
    }
    
    /**
     * 显示当前句子
     */
    showCurrentSentence() {
        if (!this.currentSegment) return;
        
        const subtitles = this.currentSegment.subtitles;
        
        if (this.currentSentenceIndex >= subtitles.length) {
            // 当前分段完成
            this.onSegmentComplete();
            return;
        }
        
        const subtitle = subtitles[this.currentSentenceIndex];
        console.log('[WordFillTraining] showCurrentSentence:', {
            index: this.currentSentenceIndex,
            content: subtitle.content,
            startTime: subtitle.startTime,
            endTime: subtitle.endTime
        });
        
        const sentenceEl = document.getElementById('sentenceContent');
        const translationEl = document.getElementById('sentenceTranslation');
        
        if (!sentenceEl) return;
        
        // 显示分段和句子信息
        const progressText = `分段 ${this.currentSegmentIndex + 1}/${this.segments.length} | 句子 ${this.currentSentenceIndex + 1}/${subtitles.length}`;
        document.getElementById('trainingProgress').textContent = progressText;
        
        // 生成填空
        this.currentBlanks = this.generateBlanks(subtitle.content);
        this.answers = {};
        
        // 渲染句子
        sentenceEl.innerHTML = this.renderSentenceWithBlanks(subtitle.content, this.currentBlanks);
        
        // 存储中文翻译，默认隐藏
        this.currentTranslation = this.getChineseTranslation(subtitle.startTime, subtitle.endTime);
        this.translationVisible = false;
        
        if (translationEl) {
            translationEl.textContent = this.currentTranslation || '';
            translationEl.classList.add('hidden');
        }
        
        // 更新翻译按钮状态
        this.updateTranslationButton();
        
        // 重置道具状态
        this.usedHintCard = false;
        
        // 渲染道具
        this.renderItems();
        
        // 渲染候选词
        this.renderCandidates(this.currentBlanks);
        
        // 绑定填空交互
        this.bindBlankInteractions();
        
        // 清空结果
        this.clearResult();
        
        // 禁用下一句按钮
        const nextBtn = document.getElementById('nextSentenceBtn');
        if (nextBtn) {
            nextBtn.disabled = true;
        }
        
        // 播放当前句子
        setTimeout(() => this.playCurrentSentence(subtitle), 500);
    }
    
    /**
     * 根据时间获取中文翻译
     */
    getChineseTranslation(startTime, endTime) {
        if (!this.zhSubtitles || this.zhSubtitles.length === 0) return null;
        
        const midTime = (startTime + endTime) / 2;
        
        for (const sub of this.zhSubtitles) {
            if (midTime >= sub.startTime && midTime <= sub.endTime) {
                return sub.content;
            }
        }
        
        for (const sub of this.zhSubtitles) {
            if (Math.abs(sub.startTime - startTime) < 0.5 || Math.abs(sub.endTime - endTime) < 0.5) {
                return sub.content;
            }
        }
        
        return null;
    }
    
    /**
     * 切换翻译显示/隐藏
     */
    toggleTranslation() {
        const translationEl = document.getElementById('sentenceTranslation');
        if (!translationEl || !this.currentTranslation) return;
        
        this.translationVisible = !this.translationVisible;
        
        if (this.translationVisible) {
            translationEl.classList.remove('hidden');
        } else {
            translationEl.classList.add('hidden');
        }
        
        this.updateTranslationButton();
    }
    
    /**
     * 更新翻译按钮状态
     */
    updateTranslationButton() {
        const btn = document.getElementById('showTranslationBtn');
        if (!btn) return;
        
        if (!this.currentTranslation) {
            btn.disabled = true;
            btn.innerHTML = '<i class="ph ph-translate"></i> 暂无翻译';
        } else if (this.translationVisible) {
            btn.disabled = false;
            btn.innerHTML = '<i class="ph ph-eye-slash"></i> 隐藏翻译';
        } else {
            btn.disabled = false;
            btn.innerHTML = '<i class="ph ph-translate"></i> 显示翻译';
        }
    }
    
    /**
     * 分段完成处理
     */
    onSegmentComplete() {
        console.log('[WordFillTraining] 分段', this.currentSegmentIndex, '完成');
        
        // 保存进度
        this.saveCurrentProgress();
        
        // 显示分段完成提示
        const sentenceEl = document.getElementById('sentenceContent');
        if (sentenceEl) {
            sentenceEl.innerHTML = `
                <div class="segment-complete">
                    <div class="complete-icon">🎉</div>
                    <h3>分段 ${this.currentSegmentIndex + 1} 完成！</h3>
                    <p>正确: ${this.correctCount} | 错误: ${this.wrongCount}</p>
                    <p>正确率: ${Math.round(this.correctCount / (this.correctCount + this.wrongCount) * 100)}%</p>
                    ${this.currentSegmentIndex < this.segments.length - 1 ? 
                        '<button class="training-action-btn" id="nextSegmentBtn">下一分段</button>' : 
                        '<button class="training-action-btn" onclick="window.location.href=\'word-fill-select.html\'">返回选择</button>'
                    }
                </div>
            `;
            
            // 绑定下一分段按钮
            const nextSegmentBtn = document.getElementById('nextSegmentBtn');
            if (nextSegmentBtn) {
                nextSegmentBtn.addEventListener('click', () => {
                    this.startSegment(this.currentSegmentIndex + 1);
                });
            }
        }
        
        // 清空候选词
        const candidatesEl = document.getElementById('candidatesList');
        if (candidatesEl) {
            candidatesEl.innerHTML = '';
        }
    }
    
    /**
     * 生成填空
     */
    generateBlanks(sentence) {
        const words = sentence.split(/\s+/);
        const validWords = words.filter(word => {
            const clean = word.toLowerCase().replace(/[^a-z]/g, '');
            return clean.length >= 3 && !this.stopWords.includes(clean);
        });
        
        const blankCount = Math.min(2, validWords.length);
        const shuffled = [...validWords].sort(() => Math.random() - 0.5);
        const wordsToBlank = shuffled.slice(0, blankCount);
        
        return wordsToBlank.map((word, index) => ({
            id: `blank-${index}`,
            word: word,
            cleanWord: word.toLowerCase().replace(/[^a-z]/g, '')
        }));
    }
    
    /**
     * 渲染带填空的句子
     */
    renderSentenceWithBlanks(sentence, blanks) {
        let html = sentence;
        
        blanks.forEach(blank => {
            const regex = new RegExp(`\\b${this.escapeRegex(blank.word)}\\b`, 'i');
            html = html.replace(regex, `<span class="training-blank" data-blank-id="${blank.id}" data-answer="${blank.cleanWord}">_____</span>`);
        });
        
        return html;
    }
    
    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    
    /**
     * 渲染候选词
     */
    renderCandidates(blanks) {
        const candidatesEl = document.getElementById('candidatesList');
        if (!candidatesEl) return;
        
        const candidates = blanks.map(b => b.cleanWord);
        
        while (candidates.length < blanks.length + 2) {
            const randomWord = this.getRandomWord();
            if (randomWord && !candidates.includes(randomWord)) {
                candidates.push(randomWord);
            }
        }
        
        const shuffled = candidates.sort(() => Math.random() - 0.5);
        
        candidatesEl.innerHTML = shuffled.map(word => `
            <span class="training-candidate-word" data-word="${word}" draggable="true">
                ${word}
            </span>
        `).join('');
        
        this.bindDragEvents();
    }
    
    getRandomWord() {
        if (!this.currentSegment || !this.currentSegment.subtitles) return null;
        
        const subtitles = this.currentSegment.subtitles;
        const randomSub = subtitles[Math.floor(Math.random() * subtitles.length)];
        const words = randomSub.content.split(/\s+/);
        const validWords = words.filter(word => {
            const clean = word.toLowerCase().replace(/[^a-z]/g, '');
            return clean.length >= 3 && !this.stopWords.includes(clean);
        });
        
        if (validWords.length === 0) return null;
        
        const randomWord = validWords[Math.floor(Math.random() * validWords.length)];
        return randomWord.toLowerCase().replace(/[^a-z]/g, '');
    }
    
    bindBlankInteractions() {
        const blanks = document.querySelectorAll('.training-blank');
        
        blanks.forEach(blank => {
            blank.addEventListener('click', () => {
                if (blank.dataset.filled) {
                    const word = blank.dataset.filled;
                    blank.textContent = '_____';
                    delete blank.dataset.filled;
                    delete this.answers[blank.dataset.blankId];
                    
                    const candidate = document.querySelector(`.training-candidate-word[data-word="${word}"]`);
                    if (candidate) {
                        candidate.classList.remove('used');
                    }
                }
            });
        });
    }
    
    bindDragEvents() {
        const candidates = document.querySelectorAll('.training-candidate-word');
        const blanks = document.querySelectorAll('.training-blank');
        
        candidates.forEach(candidate => {
            candidate.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', candidate.dataset.word);
                candidate.classList.add('dragging');
            });
            
            candidate.addEventListener('dragend', () => {
                candidate.classList.remove('dragging');
            });
            
            candidate.addEventListener('click', () => {
                if (candidate.classList.contains('used')) return;
                
                const word = candidate.dataset.word;
                const emptyBlank = Array.from(blanks).find(b => !b.dataset.filled);
                
                if (emptyBlank) {
                    this.fillBlank(emptyBlank, word);
                    candidate.classList.add('used');
                }
            });
        });
        
        blanks.forEach(blank => {
            blank.addEventListener('dragover', (e) => {
                e.preventDefault();
                blank.classList.add('drag-over');
            });
            
            blank.addEventListener('dragleave', () => {
                blank.classList.remove('drag-over');
            });
            
            blank.addEventListener('drop', (e) => {
                e.preventDefault();
                blank.classList.remove('drag-over');
                
                const word = e.dataTransfer.getData('text/plain');
                this.fillBlank(blank, word);
                
                const candidate = document.querySelector(`.training-candidate-word[data-word="${word}"]:not(.used)`);
                if (candidate) {
                    candidate.classList.add('used');
                }
            });
        });
    }
    
    fillBlank(blank, word) {
        blank.textContent = word;
        blank.dataset.filled = word;
        this.answers[blank.dataset.blankId] = word;
    }
    
    playCurrentSentence(subtitle) {
        if (!this.audio || !subtitle) {
            console.error('[WordFillTraining] playCurrentSentence: audio或subtitle为空');
            return;
        }
        
        console.log('[WordFillTraining] 播放句子:', {
            content: subtitle.content,
            startTime: subtitle.startTime,
            endTime: subtitle.endTime,
            duration: subtitle.endTime - subtitle.startTime,
            audioReadyState: this.audio.readyState
        });
        
        this.sentenceEndTime = subtitle.endTime;
        this.sentencePaused = false;
        
        const playWhenReady = () => {
            this.audio.currentTime = subtitle.startTime;
            console.log('[WordFillTraining] 设置currentTime为:', subtitle.startTime, '实际:', this.audio.currentTime);
            
            const playPromise = this.audio.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    this.isPlaying = true;
                    this.updatePlayButton();
                    console.log('[WordFillTraining] 播放成功');
                }).catch(err => {
                    console.error('[WordFillTraining] 播放失败:', err);
                });
            } else {
                this.isPlaying = true;
                this.updatePlayButton();
            }
        };
        
        if (this.audio.readyState >= 2) {
            playWhenReady();
        } else {
            console.log('[WordFillTraining] 等待音频加载...');
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
        
        if (this.sentenceEndTime && !this.sentencePaused) {
            const currentTime = this.audio.currentTime;
            const timeDiff = this.sentenceEndTime - currentTime;
            
            if (currentTime >= this.sentenceEndTime - 0.1) {
                console.log('[WordFillTraining] 句子结束，暂停播放', {
                    currentTime: currentTime.toFixed(2),
                    sentenceEndTime: this.sentenceEndTime.toFixed(2),
                    timeDiff: timeDiff.toFixed(2)
                });
                
                this.audio.pause();
                this.isPlaying = false;
                this.sentencePaused = true;
                this.updatePlayButton();
            }
        }
    }
    
    onAudioEnded() {
        this.isPlaying = false;
        this.updatePlayButton();
    }
    
    togglePlay() {
        if (!this.audio) return;
        
        if (this.isPlaying) {
            this.audio.pause();
            this.isPlaying = false;
        } else {
            if (this.sentencePaused && this.currentSegment) {
                const subtitle = this.currentSegment.subtitles[this.currentSentenceIndex];
                this.playCurrentSentence(subtitle);
            } else {
                this.audio.play();
                this.isPlaying = true;
            }
        }
        
        this.updatePlayButton();
    }
    
    replayCurrent() {
        if (!this.currentSegment) return;
        
        this.sentencePaused = false;
        const subtitle = this.currentSegment.subtitles[this.currentSentenceIndex];
        this.playCurrentSentence(subtitle);
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
    
    checkAnswers() {
        const blanks = document.querySelectorAll('.training-blank');
        let allCorrect = true;
        let correctCount = 0;
        
        blanks.forEach(blank => {
            const answer = blank.dataset.answer;
            const filled = blank.dataset.filled;
            
            blank.classList.remove('correct', 'wrong');
            
            if (filled && filled.toLowerCase() === answer.toLowerCase()) {
                blank.classList.add('correct');
                correctCount++;
            } else {
                blank.classList.add('wrong');
                allCorrect = false;
            }
        });
        
        this.showResult(allCorrect, correctCount, blanks.length);
        
        if (allCorrect) {
            this.correctCount++;
            const nextBtn = document.getElementById('nextSentenceBtn');
            if (nextBtn) {
                nextBtn.disabled = false;
            }
            
            this.playSound('correct');
            
            // 奖励蜂蜜币
            this.rewardHoneyCoins(10);
            
            // 自动进入下一句
            setTimeout(() => this.nextSentence(), 1500);
        } else {
            this.wrongCount++;
            this.playSound('wrong');
        }
        
        this.updateStats();
        this.saveCurrentProgress();
    }
    
    nextSentence() {
        this.currentSentenceIndex++;
        this.sentencePaused = false;
        
        if (!this.currentSegment) return;
        
        if (this.currentSentenceIndex >= this.currentSegment.subtitles.length) {
            this.onSegmentComplete();
        } else {
            this.showCurrentSentence();
        }
    }
    
    resetCurrent() {
        const blanks = document.querySelectorAll('.training-blank');
        const candidates = document.querySelectorAll('.training-candidate-word');
        
        blanks.forEach(blank => {
            blank.textContent = '_____';
            delete blank.dataset.filled;
            blank.classList.remove('correct', 'wrong');
        });
        
        candidates.forEach(candidate => {
            candidate.classList.remove('used');
        });
        
        this.answers = {};
        this.clearResult();
        
        const nextBtn = document.getElementById('nextSentenceBtn');
        if (nextBtn) {
            nextBtn.disabled = true;
        }
    }
    
    showResult(isCorrect, correctCount, total) {
        const container = document.getElementById('resultContainer');
        if (!container) return;
        
        if (isCorrect) {
            container.innerHTML = `
                <div class="result-message success">
                    <i class="ph ph-check-circle"></i>
                    <span>🎉 正确！继续下一句...</span>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div class="result-message error">
                    <i class="ph ph-x-circle"></i>
                    <span>正确 ${correctCount}/${total}，请修改错误答案</span>
                </div>
            `;
        }
    }
    
    clearResult() {
        const container = document.getElementById('resultContainer');
        if (container) {
            container.innerHTML = '';
        }
    }
    
    updateProgress() {
        const progress = document.getElementById('trainingProgress');
        const stat = document.getElementById('progressStat');
        
        if (this.currentSegment) {
            const current = this.currentSegmentIndex + 1;
            const total = this.segments.length;
            
            if (progress) progress.textContent = `分段 ${current}/${total}`;
            if (stat) stat.textContent = `${current}/${total}`;
        }
    }
    
    updateStats() {
        const correctEl = document.getElementById('correctStat');
        const wrongEl = document.getElementById('wrongStat');
        
        if (correctEl) correctEl.textContent = this.correctCount;
        if (wrongEl) wrongEl.textContent = this.wrongCount;
    }
    
    showTrainingComplete() {
        const sentenceEl = document.getElementById('sentenceContent');
        const candidatesEl = document.getElementById('candidatesList');
        
        if (sentenceEl) {
            sentenceEl.innerHTML = `
                <div class="training-complete">
                    <div class="complete-icon">🏆</div>
                    <h3>全部训练完成！</h3>
                    <p>正确: ${this.correctCount} | 错误: ${this.wrongCount}</p>
                    <p>正确率: ${Math.round(this.correctCount / (this.correctCount + this.wrongCount) * 100)}%</p>
                    <button class="training-action-btn" onclick="window.location.href='word-fill-select.html'">
                        返回选择其他资源
                    </button>
                </div>
            `;
        }
        
        if (candidatesEl) {
            candidatesEl.innerHTML = '';
        }
        
        // 清除进度
        clearProgress(this.resource.id);
        
        // 禁用按钮
        const checkBtn = document.getElementById('checkAnswerBtn');
        const nextBtn = document.getElementById('nextSentenceBtn');
        const resetBtn = document.getElementById('resetBtn');
        
        if (checkBtn) checkBtn.disabled = true;
        if (nextBtn) nextBtn.disabled = true;
        if (resetBtn) resetBtn.disabled = true;
    }
    
    playSound(type) {
        try {
            const sound = new Audio(type === 'correct' ? 
                '../按键提示音效/答对提示音.mp3' : 
                '../按键提示音效/打错提示音.mp3'
            );
            sound.volume = 0.5;
            sound.play().catch(() => {});
        } catch (e) {
            // 忽略音效错误
        }
    }
    
    /**
     * 奖励蜂蜜币
     */
    rewardHoneyCoins(amount) {
        try {
            if (this.activeDoublePoints) {
                amount *= 2;
                this.activeDoublePoints = false;
                console.log('[WordFillTraining] 双倍积分激活，奖励翻倍:', amount);
            }
            
            const newAmount = Store.addHoneyCoins(amount);
            console.log('[WordFillTraining] 奖励蜂蜜币:', amount, '余额:', newAmount);
            
            this.showCoinReward(amount);
        } catch (error) {
            console.error('[WordFillTraining] 奖励蜂蜜币失败:', error);
        }
    }
    
    /**
     * 显示蜂蜜币奖励动画
     */
    showCoinReward(amount) {
        const container = document.getElementById('resultContainer');
        if (!container) return;
        
        const rewardEl = document.createElement('div');
        rewardEl.className = 'coin-reward-toast';
        rewardEl.innerHTML = `
            <span class="coin-icon">🍯</span>
            <span>+${amount} 蜂蜜币</span>
        `;
        
        container.appendChild(rewardEl);
        
        setTimeout(() => {
            rewardEl.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            rewardEl.classList.remove('show');
            setTimeout(() => rewardEl.remove(), 300);
        }, 2000);
    }
    
    /**
     * 渲染道具列表
     */
    renderItems() {
        const itemsList = document.getElementById('itemsList');
        if (!itemsList) return;
        
        const ownedItems = this.getOwnedItems();
        
        const hintCardQty = ownedItems['hint-card'] || 0;
        const doublePointsQty = ownedItems['double-points'] || 0;
        
        let html = '';
        
        if (hintCardQty > 0) {
            const disabled = this.usedHintCard ? 'disabled' : '';
            html += `
                <button class="item-btn hint-card-btn" data-item="hint-card" ${disabled}>
                    <span class="item-icon">💡</span>
                    <span class="item-name">提示卡</span>
                    <span class="item-qty">x${hintCardQty}</span>
                </button>
            `;
        }
        
        if (doublePointsQty > 0) {
            const activeClass = this.activeDoublePoints ? 'active' : '';
            const disabled = this.activeDoublePoints ? 'disabled' : '';
            html += `
                <button class="item-btn double-points-btn ${activeClass}" data-item="double-points" ${disabled}>
                    <span class="item-icon">✨</span>
                    <span class="item-name">${this.activeDoublePoints ? '已激活' : '双倍积分'}</span>
                    <span class="item-qty">x${doublePointsQty}</span>
                </button>
            `;
        }
        
        if (html === '') {
            html = '<span class="no-items">暂无道具，去小店购买吧~</span>';
        }
        
        itemsList.innerHTML = html;
        
        this.bindItemEvents();
    }
    
    /**
     * 获取已拥有的道具
     */
    getOwnedItems() {
        const raw = localStorage.getItem('beelisten_owned_items');
        if (!raw) return {};
        try {
            return JSON.parse(raw);
        } catch {
            return {};
        }
    }
    
    /**
     * 绑定道具按钮事件
     */
    bindItemEvents() {
        const buttons = document.querySelectorAll('.item-btn');
        buttons.forEach(btn => {
            btn.onclick = (e) => {
                const item = e.currentTarget.dataset.item;
                if (item === 'hint-card') {
                    this.useHintCard();
                } else if (item === 'double-points') {
                    this.useDoublePoints();
                }
            };
        });
    }
    
    /**
     * 使用提示卡
     */
    useHintCard() {
        if (this.usedHintCard) {
            console.log('[WordFillTraining] 本句已使用过提示卡');
            return;
        }
        
        const blanks = document.querySelectorAll('.training-blank:not(.filled)');
        if (blanks.length === 0) {
            console.log('[WordFillTraining] 没有可填的空白');
            return;
        }
        
        const ownedItems = this.getOwnedItems();
        if ((ownedItems['hint-card'] || 0) <= 0) {
            console.log('[WordFillTraining] 没有提示卡');
            return;
        }
        
        const randomBlank = blanks[Math.floor(Math.random() * blanks.length)];
        const blankIndex = parseInt(randomBlank.dataset.index);
        const correctAnswer = this.currentBlanks[blankIndex];
        
        if (correctAnswer) {
            randomBlank.textContent = correctAnswer;
            randomBlank.classList.add('filled', 'hint-used');
            randomBlank.dataset.filled = correctAnswer;
            this.answers[blankIndex] = correctAnswer;
            
            ownedItems['hint-card'] -= 1;
            if (ownedItems['hint-card'] <= 0) delete ownedItems['hint-card'];
            localStorage.setItem('beelisten_owned_items', JSON.stringify(ownedItems));
            
            this.usedHintCard = true;
            this.renderItems();
            
            console.log('[WordFillTraining] 使用提示卡，填入:', correctAnswer);
        }
    }
    
    /**
     * 使用双倍积分
     */
    useDoublePoints() {
        if (this.activeDoublePoints) {
            console.log('[WordFillTraining] 双倍积分已激活');
            return;
        }
        
        const ownedItems = this.getOwnedItems();
        if ((ownedItems['double-points'] || 0) <= 0) {
            console.log('[WordFillTraining] 没有双倍积分卡');
            return;
        }
        
        ownedItems['double-points'] -= 1;
        if (ownedItems['double-points'] <= 0) delete ownedItems['double-points'];
        localStorage.setItem('beelisten_owned_items', JSON.stringify(ownedItems));
        
        this.activeDoublePoints = true;
        this.renderItems();
        
        console.log('[WordFillTraining] 激活双倍积分');
    }
}

// 初始化
const trainingPage = new WordFillTraining();
export default trainingPage;
