/**
 * 词块填空训练页面
 * 负责训练页面的整体流程协调
 */

import { parseSRT } from './utils/srtParser.js';
import { formatTime } from './utils/time.js';
import { formatSegmentDuration } from './utils/audio-segment.js';
import { loadProgress } from './store/training-progress.js';
import { WordFillEngine } from './training/word-fill-core.js';
import { AudioManager } from './training/audio-manager.js';
import { SegmentManager } from './training/segment-manager.js';
import { ItemManager } from './training/item-manager.js';
import Store from './store/index.js';

class TrainingPage {
    constructor() {
        this.resource = null;
        this.allSubtitles = [];
        this.zhSubtitles = [];
        
        this.currentBlanks = [];
        this.answers = {};
        this.fillEngine = new WordFillEngine({
            defaultBlankCount: 2,
            minWordLength: 3
        });
        
        this.correctCount = 0;
        this.wrongCount = 0;
        
        this.translationVisible = false;
        this.currentTranslation = null;
        
        this.audioElement = document.getElementById('trainingAudio');
        this.audioManager = new AudioManager(this.audioElement);
        this.segmentManager = null;
        this.itemManager = new ItemManager();
        
        this.init();
    }
    
    async init() {
        console.log('[TrainingPage] 初始化训练页面');
        
        const resourceData = sessionStorage.getItem('wordFillResource');
        if (!resourceData) {
            alert('请先选择一个训练资源');
            window.location.href = 'word-fill-select.html';
            return;
        }
        
        this.resource = JSON.parse(resourceData);
        document.getElementById('trainingTitle').textContent = `✍️ ${this.resource.title}`;
        
        await this.loadSubtitles();
        
        this.segmentManager = new SegmentManager(this.allSubtitles, this.resource.id);
        this.segmentManager.initSegments();
        
        this.renderSegmentSelector();
        this.bindEvents();
        this.loadAudio();
        
        if (this.resource.continueProgress) {
            this.restoreProgress();
        } else if (this.resource.startSegmentIndex !== null) {
            this.startSegment(this.resource.startSegmentIndex);
        } else {
            this.startSegment(0);
        }
        
        this.updateStats();
    }
    
    async loadSubtitles() {
        try {
            const enResponse = await fetch(`/Beelisten-V3/听力资源/${this.resource.subtitleFile}`);
            const enSrtContent = await enResponse.text();
            this.allSubtitles = parseSRT(enSrtContent);
            console.log('[WordFillTraining] 英文字幕加载完成:', this.allSubtitles.length, '条');
        } catch (error) {
            console.error('[WordFillTraining] 英文字幕加载失败:', error);
            this.allSubtitles = [];
        }
        
        if (this.resource.subtitleFileZh) {
            try {
                const zhResponse = await fetch(`/Beelisten-V3/听力资源/${this.resource.subtitleFileZh}`);
                const zhSrtContent = await zhResponse.text();
                this.zhSubtitles = parseSRT(zhSrtContent);
                console.log('[WordFillTraining] 中文字幕加载完成:', this.zhSubtitles.length, '条');
            } catch (error) {
                console.error('[TrainingPage] 中文字幕加载失败:', error);
                this.zhSubtitles = [];
            }
        }
    }
    
    renderSegmentSelector() {
        const selectorEl = document.getElementById('segmentSelector');
        if (!selectorEl || !this.segmentManager) return;
        
        const segments = this.segmentManager.segments;
        selectorEl.innerHTML = segments.map((seg, index) => `
            <div class="segment-tab ${index === this.segmentManager.currentSegmentIndex ? 'active' : ''}" 
                 data-segment-index="${index}">
                <span class="segment-tab-name">${seg.name}</span>
                <span class="segment-tab-duration">${formatSegmentDuration(seg.duration)}</span>
            </div>
        `).join('');
        
        selectorEl.querySelectorAll('.segment-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const index = parseInt(tab.dataset.segmentIndex);
                this.startSegment(index);
            });
        });
    }
    
    startSegment(segmentIndex) {
        console.log('[TrainingPage] startSegment called:', segmentIndex, 'segments count:', this.segmentManager.segments.length);
        
        if (this.segmentManager.segments.length === 0) {
            console.error('[TrainingPage] 没有分段数据！字幕可能加载失败');
            const sentenceEl = document.getElementById('sentenceContent');
            if (sentenceEl) {
                sentenceEl.innerHTML = `
                    <div class="error-message">
                        <div class="error-icon">⚠️</div>
                        <h3>字幕加载失败</h3>
                        <p>请检查网络连接后刷新页面重试</p>
                        <button class="training-action-btn" onclick="window.location.reload()">刷新页面</button>
                    </div>
                `;
            }
            return;
        }
        
        if (!this.segmentManager.startSegment(segmentIndex)) {
            this.showTrainingComplete();
            return;
        }
        
        this.correctCount = 0;
        this.wrongCount = 0;
        this.itemManager.resetForNewSegment();
        
        this.updateSegmentSelector();
        this.updateProgress();
        this.showCurrentSentence();
    }
    
    restoreProgress() {
        if (this.segmentManager.restoreProgress()) {
            const progress = loadProgress(this.resource.id);
            if (progress) {
                this.correctCount = progress.correctCount || 0;
                this.wrongCount = progress.wrongCount || 0;
                console.log('[TrainingPage] 恢复进度: 分段', this.segmentManager.currentSegmentIndex);
            }
        }
        this.startSegment(this.segmentManager.currentSegmentIndex);
    }
    
    loadAudio() {
        if (!this.audioElement || !this.resource) return;
        
        this.audioElement.src = `/Beelisten-V3/听力资源/${this.resource.audioFile}`;
        this.audioElement.load();
        
        this.audioManager.onTimeUpdate((currentTime) => {
            this.updateTimeDisplay();
            this.updateProgressBar();
        });
        
        this.audioElement.addEventListener('ended', () => {
            this.audioManager.isPlaying = false;
            this.updatePlayButton();
        });
        
        this.audioElement.addEventListener('loadedmetadata', () => {
            this.updateTimeDisplay();
        });
    }
    
    bindEvents() {
        const playPauseBtn = document.getElementById('playPauseBtn');
        if (playPauseBtn) {
            playPauseBtn.addEventListener('click', () => {
                this.audioManager.togglePlay();
                this.updatePlayButton();
            });
        }
        
        const replayBtn = document.getElementById('replayBtn');
        if (replayBtn) {
            replayBtn.addEventListener('click', () => {
                const sentence = this.segmentManager.getCurrentSentence();
                if (sentence) {
                    this.audioManager.replayCurrent(sentence.startTime, sentence.endTime);
                }
            });
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
        
        const volumeSlider = document.getElementById('volumeSlider');
        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => {
                const volume = e.target.value / 100;
                this.audioManager.setVolume(volume);
                this.updateVolumeIcon(volume);
            });
        }
        
        const volumeBtn = document.getElementById('volumeBtn');
        if (volumeBtn) {
            volumeBtn.addEventListener('click', () => {
                this.audioManager.toggleMute();
                this.updateVolumeIcon(this.audioManager.getVolume());
            });
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
    
    showCurrentSentence() {
        const sentence = this.segmentManager.getCurrentSentence();
        if (!sentence) {
            this.onSegmentComplete();
            return;
        }
        
        console.log('[TrainingPage] 显示当前句子:', sentence.content);
        
        const sentenceEl = document.getElementById('sentenceContent');
        const translationEl = document.getElementById('sentenceTranslation');
        
        if (!sentenceEl) return;
        
        const progress = this.segmentManager.getProgress();
        const progressText = `分段 ${progress.currentSegment}/${progress.totalSegments} | 句子 ${progress.currentSentence}/${progress.totalSentences}`;
        document.getElementById('trainingProgress').textContent = progressText;
        
        this.currentBlanks = this.fillEngine.generateBlanks(sentence.content, 2);
        this.answers = {};
        
        sentenceEl.innerHTML = this.fillEngine.renderSentenceWithBlanks(sentence.content, this.currentBlanks, 'training-blank');
        
        this.currentTranslation = this.getChineseTranslation(sentence.startTime, sentence.endTime);
        this.translationVisible = false;
        
        if (translationEl) {
            translationEl.textContent = this.currentTranslation || '';
            translationEl.classList.add('hidden');
        }
        
        this.updateTranslationButton();
        this.itemManager.resetForNewSentence();
        this.renderItems();
        this.renderCandidates(this.currentBlanks);
        this.bindBlankInteractions();
        this.clearResult();
        
        const nextBtn = document.getElementById('nextSentenceBtn');
        if (nextBtn) {
            nextBtn.disabled = true;
        }
        
        setTimeout(() => {
            this.audioManager.playCurrentSentence(sentence.startTime, sentence.endTime);
        }, 500);
    }
    
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
    
    onSegmentComplete() {
        console.log('[TrainingPage] 分段完成');
        
        this.segmentManager.saveProgress();
        
        const progress = this.segmentManager.getProgress();
        const sentenceEl = document.getElementById('sentenceContent');
        
        if (sentenceEl) {
            sentenceEl.innerHTML = `
                <div class="segment-complete">
                    <div class="complete-icon">🎉</div>
                    <h3>分段 ${progress.currentSegment} 完成！</h3>
                    <p>正确: ${this.correctCount} | 错误: ${this.wrongCount}</p>
                    <p>正确率: ${Math.round(this.correctCount / (this.correctCount + this.wrongCount) * 100)}%</p>
                    ${progress.currentSegment < progress.totalSegments ? 
                        '<button class="training-action-btn" id="nextSegmentBtn">下一分段</button>' : 
                        '<button class="training-action-btn" onclick="window.location.href=\'word-fill-select.html\'">返回选择</button>'
                    }
                </div>
            `;
            
            const nextSegmentBtn = document.getElementById('nextSegmentBtn');
            if (nextSegmentBtn) {
                nextSegmentBtn.addEventListener('click', () => {
                    this.startSegment(this.segmentManager.currentSegmentIndex + 1);
                });
            }
        }
        
        const candidatesEl = document.getElementById('candidatesList');
        if (candidatesEl) {
            candidatesEl.innerHTML = '';
        }
    }
    
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
        const segment = this.segmentManager.getCurrentSegment();
        if (!segment || !segment.subtitles) return null;
        
        const subtitles = segment.subtitles;
        const randomSub = subtitles[Math.floor(Math.random() * subtitles.length)];
        const validWords = this.fillEngine.extractValidWords(randomSub.content);
        
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
    
    updatePlayButton() {
        const btn = document.getElementById('playPauseBtn');
        if (btn) {
            btn.innerHTML = this.audioManager.isPlaying ? 
                '<i class="ph ph-pause"></i> 暂停' : 
                '<i class="ph ph-play"></i> 播放';
        }
    }
    
    updateTimeDisplay() {
        const display = document.getElementById('timeDisplay');
        if (!display || !this.audioElement) return;
        
        const current = formatTime(this.audioManager.getCurrentTime());
        const duration = formatTime(this.audioManager.getDuration());
        display.textContent = `${current} / ${duration}`;
    }
    
    updateProgressBar() {
        const filled = document.getElementById('progressFilled');
        if (!filled || !this.audioElement || !this.audioElement.duration) return;
        
        const progress = (this.audioManager.getCurrentTime() / this.audioManager.getDuration()) * 100;
        filled.style.width = `${progress}%`;
    }
    
    checkAnswers() {
        const blanks = document.querySelectorAll('.training-blank');
        const blankConfigs = Array.from(blanks).map(blank => ({
            id: blank.dataset.blankId,
            cleanWord: blank.dataset.answer
        }));
        
        const result = this.fillEngine.checkAnswers(blankConfigs, this.answers);
        
        blanks.forEach(blank => {
            const blankResult = result.results.find(r => r.blankId === blank.dataset.blankId);
            if (blankResult) {
                blank.classList.remove('correct', 'wrong');
                blank.classList.add(blankResult.isCorrect ? 'correct' : 'wrong');
            }
        });
        
        this.showResult(result.isAllCorrect, result.correctCount, result.totalCount);
        
        if (result.isAllCorrect) {
            this.correctCount++;
            const nextBtn = document.getElementById('nextSentenceBtn');
            if (nextBtn) {
                nextBtn.disabled = false;
            }
            
            this.playSound('correct');
            
            const reward = 10 * this.itemManager.getRewardMultiplier();
            this.rewardHoneyCoins(reward);
            
            setTimeout(() => this.nextSentence(), 1500);
        } else {
            this.wrongCount++;
            this.playSound('wrong');
        }
        
        this.updateStats();
        this.segmentManager.saveProgress();
    }
    
    nextSentence() {
        if (!this.segmentManager.nextSentence()) {
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
    
    updateSegmentSelector() {
        document.querySelectorAll('.segment-tab').forEach((tab, index) => {
            tab.classList.toggle('active', index === this.segmentManager.currentSegmentIndex);
        });
    }
    
    updateProgress() {
        const progress = document.getElementById('trainingProgress');
        const stat = document.getElementById('progressStat');
        
        const currentProgress = this.segmentManager.getProgress();
        if (progress) progress.textContent = `分段 ${currentProgress.currentSegment}/${currentProgress.totalSegments}`;
        if (stat) stat.textContent = `${currentProgress.currentSegment}/${currentProgress.totalSegments}`;
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
        
        this.segmentManager.clearProgress();
        
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
                '/Beelisten-V3/按键提示音效/答对提示音.mp3' : 
                '/Beelisten-V3/按键提示音效/打错提示音.mp3'
            );
            sound.volume = 0.5;
            sound.play().catch(() => {});
        } catch (e) {
            // 忽略音效错误
        }
    }
    
    rewardHoneyCoins(amount) {
        try {
            const newAmount = Store.addHoneyCoins(amount);
            console.log('[TrainingPage] 奖励蜂蜜币:', amount, '余额:', newAmount);
            this.showCoinReward(amount);
        } catch (error) {
            console.error('[TrainingPage] 奖励蜂蜜币失败:', error);
        }
    }
    
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
    
    renderItems() {
        const itemsList = document.getElementById('itemsList');
        if (!itemsList) return;
        
        const ownedItems = this.itemManager.getOwnedItems();
        
        const hintCardQty = ownedItems['hint-card'] || 0;
        const doublePointsQty = ownedItems['double-points'] || 0;
        
        let html = '';
        
        if (hintCardQty > 0) {
            const disabled = this.itemManager.usedHintCard ? 'disabled' : '';
            html += `
                <button class="item-btn hint-card-btn" data-item="hint-card" ${disabled}>
                    <span class="item-icon">💡</span>
                    <span class="item-name">提示卡</span>
                    <span class="item-qty">x${hintCardQty}</span>
                </button>
            `;
        }
        
        if (doublePointsQty > 0) {
            const activeClass = this.itemManager.activeDoublePoints ? 'active' : '';
            const disabled = this.itemManager.activeDoublePoints ? 'disabled' : '';
            html += `
                <button class="item-btn double-points-btn ${activeClass}" data-item="double-points" ${disabled}>
                    <span class="item-icon">✨</span>
                    <span class="item-name">${this.itemManager.activeDoublePoints ? '已激活' : '双倍积分'}</span>
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
    
    useHintCard() {
        if (!this.itemManager.useHintCard()) {
            return;
        }
        
        const blanks = document.querySelectorAll('.training-blank:not(.filled)');
        if (blanks.length === 0) {
            console.log('[TrainingPage] 没有可填的空白');
            return;
        }
        
        const randomBlank = blanks[Math.floor(Math.random() * blanks.length)];
        const blankId = randomBlank.dataset.blankId;
        const blankConfig = this.currentBlanks.find(b => b.id === blankId);
        
        if (blankConfig) {
            randomBlank.textContent = blankConfig.cleanWord;
            randomBlank.classList.add('filled', 'hint-used');
            randomBlank.dataset.filled = blankConfig.cleanWord;
            this.answers[blankId] = blankConfig.cleanWord;
            
            this.renderItems();
            console.log('[TrainingPage] 使用提示卡，填入:', blankConfig.cleanWord);
        }
    }
    
    useDoublePoints() {
        if (this.itemManager.useDoublePoints()) {
            this.renderItems();
        }
    }
}

const trainingPage = new TrainingPage();
export default trainingPage;
