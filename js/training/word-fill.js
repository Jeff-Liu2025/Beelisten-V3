/**
 * 单词训练模块 - 拖拽填空练习 - Beelisten v2
 * 支持从字幕生成填空题，拖拽单词填入空白处
 */

import Store from '../store/index.js';

class WordFillTraining {
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
        
        this.excludeWords = [
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
            const words = this.extractValidWords(sub.content);
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
    
    extractValidWords(sentence) {
        return sentence.split(/\s+/).filter(word => {
            const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
            return cleanWord.length >= 3 && !this.excludeWords.includes(cleanWord);
        });
    }
    
    createBlanks(sentence) {
        const words = sentence.split(/\s+/);
        const validWords = this.extractValidWords(sentence);
        const blankCount = Math.min(this.getBlankCount(), validWords.length);
        
        const shuffled = [...validWords].sort(() => Math.random() - 0.5);
        const wordsToBlank = shuffled.slice(0, blankCount);
        
        this.blanks = [];
        this.answers = {};
        
        let html = '';
        let blankIndex = 0;
        
        words.forEach((word, index) => {
            const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
            const isBlank = wordsToBlank.some(w => 
                w.toLowerCase().replace(/[^a-z]/g, '') === cleanWord
            );
            
            if (isBlank && blankIndex < blankCount) {
                const blankId = `blank-${blankIndex}`;
                this.blanks.push({
                    id: blankId,
                    answer: cleanWord,
                    originalWord: word
                });
                this.answers[blankId] = '';
                
                html += `<span class="${this.options.blankClass}" 
                              data-blank-id="${blankId}" 
                              data-answer="${cleanWord}">
                            _____
                         </span> `;
                blankIndex++;
            } else {
                html += word + ' ';
            }
        });
        
        const sentenceEl = document.getElementById(this.options.sentenceId);
        if (sentenceEl) {
            sentenceEl.innerHTML = html;
        }
        
        this.createCandidates(wordsToBlank);
        this.clearResult();
    }
    
    createCandidates(words) {
        const candidates = [...words];
        
        while (candidates.length < this.blanks.length + 2) {
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
            .flatMap(sub => this.extractValidWords(sub.content));
        
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
        let correct = 0;
        let total = this.blanks.length;
        
        const sentenceEl = document.getElementById(this.options.sentenceId);
        if (!sentenceEl) return;
        
        const blanks = sentenceEl.querySelectorAll(`.${this.options.blankClass}`);
        
        blanks.forEach(blank => {
            const answer = blank.dataset.answer;
            const filled = blank.dataset.filled;
            
            blank.classList.remove(this.options.correctClass, this.options.wrongClass);
            
            if (filled && filled.toLowerCase() === answer.toLowerCase()) {
                blank.classList.add(this.options.correctClass);
                correct++;
            } else if (filled) {
                blank.classList.add(this.options.wrongClass);
            }
        });
        
        const resultEl = document.getElementById(this.options.resultId);
        if (resultEl) {
            if (correct === total) {
                resultEl.innerHTML = `<span class="success">🎉 全部正确！${correct}/${total}</span>`;
                this.playSound('correct');
            } else {
                resultEl.innerHTML = `<span class="error">正确 ${correct}/${total}，继续加油！</span>`;
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
    return new WordFillTraining(options);
}

export default WordFillTraining;
