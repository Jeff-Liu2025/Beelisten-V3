/**
 * 单词训练模块 - 拖拽填空练习组件 - Beelisten v2
 * 支持从字幕生成填空题，拖拽单词填入空白处
 */

import { WordFillEngine } from './word-fill-core.js';
import Store from '../store/index.js';

class WordFillComponent {
    constructor(options = {}) {
        this.options = {
            sectionId: 'wordTrainSection',
            sentenceId: 'fillSentence',
            candidatesId: 'fillCandidates',
            resultId: 'fillResult',
            startBtnId: 'startFillBtn',
            checkBtnId: 'checkFillBtn',
            resetBtnId: 'resetFillBtn',
            newBtnId: 'newFillBtn',
            closeBtnId: 'closeWordTrainBtn',
            difficultyBtnClass: 'difficulty-btn',
            blankClass: 'fill-blank',
            wordBlockClass: 'word-block',
            correctClass: 'correct',
            wrongClass: 'wrong',
            ...options
        };
        
        this.subtitles = [];
        this.currentQuestion = null;
        this.difficulty = 'medium';
        this.blanks = [];
        this.answers = {};
        this.correctSound = null;
        this.wrongSound = null;
        
        this.fillEngine = new WordFillEngine({
            defaultBlankCount: this.getBlankCount(),
            minWordLength: 3
        });
        
        this.init();
    }
    
    init() {
        this.section = document.getElementById(this.options.sectionId);
        
        if (!this.section) {
            console.warn('[WordFill] 未找到训练区域:', this.options.sectionId);
            return;
        }
        
        this.loadSounds();
        this.bindEvents();
        console.log('[WordFill] 初始化完成');
    }
    
    loadSounds() {
        try {
            this.correctSound = new Audio('../按键提示音效/答对提示音.mp3');
            this.wrongSound = new Audio('../按键提示音效/打错提示音.mp3');
        } catch (err) {
            console.warn('[WordFill] 音效加载失败:', err);
        }
    }
    
    playSound(type) {
        const sound = type === 'correct' ? this.correctSound : this.wrongSound;
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(() => {});
        }
    }
    
    bindEvents() {
        const startBtn = document.getElementById(this.options.startBtnId);
        const checkBtn = document.getElementById(this.options.checkBtnId);
        const resetBtn = document.getElementById(this.options.resetBtnId);
        const newBtn = document.getElementById(this.options.newBtnId);
        const closeBtn = document.getElementById(this.options.closeBtnId);
        
        if (startBtn) {
            startBtn.addEventListener('click', () => this.startExercise());
        }
        
        if (checkBtn) {
            checkBtn.addEventListener('click', () => this.checkAnswers());
        }
        
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetExercise());
        }
        
        if (newBtn) {
            newBtn.addEventListener('click', () => this.newQuestion());
        }
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hide());
        }
        
        const difficultyBtns = this.section.querySelectorAll(`.${this.options.difficultyBtnClass}`);
        difficultyBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.difficulty = btn.dataset.difficulty;
                difficultyBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.fillEngine.options.defaultBlankCount = this.getBlankCount();
            });
        });
        
        document.addEventListener('subtitles-loaded', (e) => {
            this.subtitles = e.detail.subtitles;
        });
    }
    
    show() {
        if (this.section) {
            this.section.classList.remove('hidden');
        }
    }
    
    hide() {
        if (this.section) {
            this.section.classList.add('hidden');
        }
    }
    
    startExercise() {
        const subtitles = Store.get('subtitles');
        
        if (!subtitles || subtitles.length === 0) {
            this.showMessage('请先加载字幕文件', 'warning');
            return;
        }
        
        this.subtitles = subtitles;
        this.generateQuestion();
        this.show();
    }
    
    generateQuestion() {
        const validSubtitles = this.subtitles.filter(sub => {
            const words = this.fillEngine.extractValidWords(sub.content);
            return words.length >= this.getMinWords();
        });
        
        if (validSubtitles.length === 0) {
            this.showMessage('没有足够的有效句子生成练习', 'warning');
            return;
        }
        
        const randomIndex = Math.floor(Math.random() * validSubtitles.length);
        const selectedSubtitle = validSubtitles[randomIndex];
        
        this.currentQuestion = {
            sentence: selectedSubtitle.content,
            startTime: selectedSubtitle.startTime
        };
        
        this.createBlanks(selectedSubtitle.content);
    }
    
    getMinWords() {
        switch (this.difficulty) {
            case 'easy': return 3;
            case 'medium': return 4;
            case 'hard': return 5;
            default: return 4;
        }
    }
    
    getBlankCount() {
        switch (this.difficulty) {
            case 'easy': return 1;
            case 'medium': return 2;
            case 'hard': return 3;
            default: return 2;
        }
    }
    
    createBlanks(sentence) {
        const words = sentence.split(/\s+/);
        const blankCount = this.getBlankCount();
        
        this.blanks = this.fillEngine.generateBlanks(sentence, blankCount);
        this.answers = {};
        
        let html = '';
        
        words.forEach((word, index) => {
            const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
            const blankConfig = this.blanks.find(b => b.cleanWord === cleanWord);
            
            if (blankConfig) {
                html += `<span class="${this.options.blankClass}" 
                              data-blank-id="${blankConfig.id}" 
                              data-answer="${blankConfig.cleanWord}">
                            _____
                         </span> `;
            } else {
                html += word + ' ';
            }
        });
        
        const sentenceEl = document.getElementById(this.options.sentenceId);
        if (sentenceEl) {
            sentenceEl.innerHTML = html;
        }
        
        this.createCandidates(this.blanks);
        this.clearResult();
    }
    
    createCandidates(blanks) {
        const candidates = blanks.map(b => b.cleanWord);
        
        while (candidates.length < blanks.length + 2) {
            const randomWord = this.getRandomWord();
            if (randomWord && !candidates.includes(randomWord)) {
                candidates.push(randomWord);
            }
        }
        
        const shuffled = candidates.sort(() => Math.random() - 0.5);
        
        const candidatesEl = document.getElementById(this.options.candidatesId);
        if (candidatesEl) {
            candidatesEl.innerHTML = shuffled.map(word => {
                const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
                return `<span class="${this.options.wordBlockClass}" 
                             data-word="${cleanWord}"
                             draggable="true">
                            ${cleanWord}
                        </span>`;
            }).join('');
            
            this.bindDragEvents();
        }
    }
    
    getRandomWord() {
        const allWords = this.subtitles
            .flatMap(sub => this.fillEngine.extractValidWords(sub.content));
        
        if (allWords.length === 0) return null;
        
        const randomIndex = Math.floor(Math.random() * allWords.length);
        return allWords[randomIndex];
    }
    
    bindDragEvents() {
        const candidatesEl = document.getElementById(this.options.candidatesId);
        const sentenceEl = document.getElementById(this.options.sentenceId);
        
        if (!candidatesEl || !sentenceEl) return;
        
        const wordBlocks = candidatesEl.querySelectorAll(`.${this.options.wordBlockClass}`);
        const blanks = sentenceEl.querySelectorAll(`.${this.options.blankClass}`);
        
        wordBlocks.forEach(block => {
            block.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', block.dataset.word);
                block.classList.add('dragging');
            });
            
            block.addEventListener('dragend', () => {
                block.classList.remove('dragging');
            });
            
            block.addEventListener('click', () => {
                const word = block.dataset.word;
                const emptyBlank = Array.from(blanks).find(blank => 
                    !blank.dataset.filled || blank.dataset.filled === ''
                );
                
                if (emptyBlank) {
                    this.fillBlank(emptyBlank, word);
                    block.classList.add('used');
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
                
                const draggingBlock = candidatesEl.querySelector('.dragging');
                if (draggingBlock) {
                    draggingBlock.classList.add('used');
                }
            });
            
            blank.addEventListener('click', () => {
                if (blank.dataset.filled) {
                    this.clearBlank(blank);
                }
            });
        });
    }
    
    fillBlank(blank, word) {
        blank.textContent = word;
        blank.dataset.filled = word;
        this.answers[blank.dataset.blankId] = word;
    }
    
    clearBlank(blank) {
        const word = blank.dataset.filled;
        blank.textContent = '_____';
        blank.dataset.filled = '';
        this.answers[blank.dataset.blankId] = '';
        
        const candidatesEl = document.getElementById(this.options.candidatesId);
        if (candidatesEl && word) {
            const block = candidatesEl.querySelector(`[data-word="${word}"]`);
            if (block) {
                block.classList.remove('used');
            }
        }
    }
    
    checkAnswers() {
        const sentenceEl = document.getElementById(this.options.sentenceId);
        if (!sentenceEl) return;
        
        const blanks = sentenceEl.querySelectorAll(`.${this.options.blankClass}`);
        const blankConfigs = Array.from(blanks).map(blank => ({
            id: blank.dataset.blankId,
            cleanWord: blank.dataset.answer
        }));
        
        const result = this.fillEngine.checkAnswers(blankConfigs, this.answers);
        
        blanks.forEach(blank => {
            const blankResult = result.results.find(r => r.blankId === blank.dataset.blankId);
            if (blankResult) {
                blank.classList.remove(this.options.correctClass, this.options.wrongClass);
                if (blankResult.userAnswer) {
                    blank.classList.add(blankResult.isCorrect ? this.options.correctClass : this.options.wrongClass);
                }
            }
        });
        
        const resultEl = document.getElementById(this.options.resultId);
        if (resultEl) {
            if (result.isAllCorrect) {
                resultEl.innerHTML = `<span class="success">🎉 全部正确！${result.correctCount}/${result.totalCount}</span>`;
                this.playSound('correct');
            } else {
                resultEl.innerHTML = `<span class="error">正确 ${result.correctCount}/${result.totalCount}，继续加油！</span>`;
                this.playSound('wrong');
            }
        }
    }
    
    resetExercise() {
        const sentenceEl = document.getElementById(this.options.sentenceId);
        const candidatesEl = document.getElementById(this.options.candidatesId);
        
        if (sentenceEl) {
            const blanks = sentenceEl.querySelectorAll(`.${this.options.blankClass}`);
            blanks.forEach(blank => {
                this.clearBlank(blank);
                blank.classList.remove(this.options.correctClass, this.options.wrongClass);
            });
        }
        
        if (candidatesEl) {
            const blocks = candidatesEl.querySelectorAll(`.${this.options.wordBlockClass}`);
            blocks.forEach(block => block.classList.remove('used'));
        }
        
        this.clearResult();
    }
    
    newQuestion() {
        this.generateQuestion();
        this.clearResult();
    }
    
    clearResult() {
        const resultEl = document.getElementById(this.options.resultId);
        if (resultEl) {
            resultEl.innerHTML = '';
        }
    }
    
    showMessage(message, type = 'info') {
        const sentenceEl = document.getElementById(this.options.sentenceId);
        if (sentenceEl) {
            sentenceEl.innerHTML = `<div class="puzzle-placeholder">${message}</div>`;
        }
    }
}

export function createWordFillTraining(options) {
    return new WordFillComponent(options);
}

export default WordFillComponent;
