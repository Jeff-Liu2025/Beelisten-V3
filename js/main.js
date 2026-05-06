/**
 * Beelisten v2 - 主入口文件
 * 负责初始化所有模块、页面导航、播客列表渲染等
 */

import './env-config.js';
import Player from './player/index.js';
import SubtitleManager from './subtitle/index.js';
import Dictionary from './dictionary/index.js';
import WordFillComponent from './training/word-fill.js';
import Shop from './shop/index.js';
import Store from './store/index.js';
import { podcastsData } from './podcasts-data.js';

class BeelistenApp {
    constructor() {
        this.player = null;
        this.subtitleManager = null;
        this.dictionary = null;
        this.wordFillTraining = null;
        this.shop = null;
        this.currentPage = 'learn';
        this.currentPodcast = null;
    }
    
    init() {
        console.log('🚀 Beelisten v2 启动中...');
        
        this.initModules();
        this.bindNavigation();
        this.bindPageEvents();
        this.renderPodcastList();
        
        console.log('✅ Beelisten v2 初始化完成');
    }
    
    initModules() {
        this.player = new Player({
            audioId: 'podcastAudio',
            playBtnId: 'podcastPlayPauseBtn',
            rewindBtnId: 'podcastRewindBtn',
            forwardBtnId: 'podcastForwardBtn',
            progressBarId: 'podcastProgressBar',
            progressFilledId: 'podcastProgressFilled',
            currentTimeId: 'podcastCurrentTime',
            durationId: 'podcastDuration',
            volumeBtnId: 'volumeBtn',
            volumeSliderId: 'volumeSlider'
        });
        
        this.subtitleManager = new SubtitleManager({
            contentId: 'subtitleContent'
        });
        
        this.dictionary = new Dictionary({
            popupId: 'dictPopup',
            wordId: 'dictWord',
            phoneticId: 'dictPhonetic',
            contentId: 'dictContent',
            closeId: 'dictClose'
        });
        
        this.wordFillTraining = new WordFillComponent({
            sectionId: 'wordTrainSection',
            sentenceId: 'fillSentence',
            candidatesId: 'fillCandidates',
            resultId: 'fillResult',
            startBtnId: 'startFillBtn',
            checkBtnId: 'checkFillBtn',
            resetBtnId: 'resetFillBtn',
            newBtnId: 'newFillBtn',
            closeBtnId: 'closeWordTrainBtn'
        });
        
        this.shop = new Shop();
        this.shop.init();
    }
    
    bindNavigation() {
        const menuItems = document.querySelectorAll('.menu-item');
        
        menuItems.forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.page;
                this.navigateTo(page);
                
                menuItems.forEach(mi => mi.classList.remove('active'));
                item.classList.add('active');
            });
        });
        
        const backBtns = document.querySelectorAll('.back-btn');
        backBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const backTo = btn.dataset.back;
                this.navigateTo(backTo);
            });
        });
    }
    
    navigateTo(page) {
        const pages = document.querySelectorAll('.page-content');
        pages.forEach(p => p.classList.add('hidden'));
        
        const targetPage = document.getElementById(`${page}Page`);
        if (targetPage) {
            targetPage.classList.remove('hidden');
            this.currentPage = page;
            Store.set('currentPage', page);
            
            if (page === 'shop' && this.shop) {
                this.shop.render('shopPage');
            }
        }
    }
    
    bindPageEvents() {
        this.bindCategoryCards();
        this.bindRecommendCards();
        this.bindMoreMenu();
        this.bindWordTrainButton();
        this.bindTestPage();
        this.bindReviewPage();
    }
    
    bindReviewPage() {
        const modeCards = document.querySelectorAll('.mode-card');
        modeCards.forEach(card => {
            card.addEventListener('click', () => {
                const mode = card.dataset.mode;
                this.startReviewMode(mode);
            });
        });
        
        const startPlanBtn = document.getElementById('startPlanBtn');
        if (startPlanBtn) {
            startPlanBtn.addEventListener('click', () => {
                this.startReviewMode('word-fill');
            });
        }
        
        const closeExerciseBtn = document.getElementById('closeExerciseBtn');
        if (closeExerciseBtn) {
            closeExerciseBtn.addEventListener('click', () => {
                const exerciseEl = document.getElementById('reviewExercise');
                if (exerciseEl) {
                    exerciseEl.classList.add('hidden');
                }
            });
        }
        
        const prevExerciseBtn = document.getElementById('prevExerciseBtn');
        const nextExerciseBtn = document.getElementById('nextExerciseBtn');
        const submitExerciseBtn = document.getElementById('submitExerciseBtn');
        
        if (prevExerciseBtn) {
            prevExerciseBtn.addEventListener('click', () => this.prevExercise());
        }
        if (nextExerciseBtn) {
            nextExerciseBtn.addEventListener('click', () => this.nextExercise());
        }
        if (submitExerciseBtn) {
            submitExerciseBtn.addEventListener('click', () => this.submitExercise());
        }
    }
    
    startReviewMode(mode) {
        if (mode === 'word-fill') {
            window.location.href = 'word-fill-select.html';
            return;
        }
        
        if (mode === 'quiz-listen') {
            window.location.href = 'quiz-select.html';
            return;
        }
        
        const exerciseEl = document.getElementById('reviewExercise');
        const titleEl = document.getElementById('exerciseTitle');
        
        if (!exerciseEl) return;
        
        exerciseEl.classList.remove('hidden');
        
        if (titleEl) {
            const modeNames = {
                'listening-fill': '听力填空练习',
                'word-match': '词汇匹配练习',
                'listening-repeat': '听力复述练习'
            };
            titleEl.textContent = modeNames[mode] || '练习';
        }
        
        this.showExercisePlaceholder(mode);
    }
    
    startWordFillExercise() {
        const subtitles = Store.get('subtitles');
        
        if (!subtitles || subtitles.length === 0) {
            this.showExerciseMessage('请先在学习页面选择一个听力资源，加载字幕后才能进行练习');
            return;
        }
        
        this.currentExerciseIndex = 0;
        this.exerciseQuestions = this.generateExerciseQuestions(subtitles, 10);
        this.renderCurrentExercise();
    }
    
    generateExerciseQuestions(subtitles, count) {
        const validSubtitles = subtitles.filter(sub => {
            const words = sub.content.split(/\s+/).filter(w => w.length >= 3);
            return words.length >= 4;
        });
        
        const shuffled = [...validSubtitles].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count);
    }
    
    renderCurrentExercise() {
        if (!this.exerciseQuestions || this.exerciseQuestions.length === 0) return;
        
        const question = this.exerciseQuestions[this.currentExerciseIndex];
        const progressEl = document.getElementById('exerciseProgress');
        const questionEl = document.getElementById('exerciseQuestion');
        const optionsEl = document.getElementById('exerciseOptions');
        
        if (progressEl) {
            progressEl.textContent = `${this.currentExerciseIndex + 1}/${this.exerciseQuestions.length}`;
        }
        
        if (questionEl && optionsEl) {
            const words = question.content.split(/\s+/);
            const validWords = words.filter(w => {
                const clean = w.toLowerCase().replace(/[^a-z]/g, '');
                return clean.length >= 3 && !['the', 'and', 'for', 'are', 'was', 'were', 'been', 'being', 'have', 'has', 'had', 'will', 'would', 'could', 'should', 'with', 'this', 'that', 'these', 'those', 'from'].includes(clean);
            });
            
            const blankCount = Math.min(2, validWords.length);
            const shuffledWords = [...validWords].sort(() => Math.random() - 0.5);
            const wordsToBlank = shuffledWords.slice(0, blankCount);
            
            let html = '';
            words.forEach(word => {
                const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
                if (wordsToBlank.some(w => w.toLowerCase().replace(/[^a-z]/g, '') === cleanWord)) {
                    html += `<span class="exercise-blank" data-answer="${cleanWord}">_____</span> `;
                } else {
                    html += word + ' ';
                }
            });
            
            questionEl.innerHTML = html;
            
            const options = [...wordsToBlank];
            while (options.length < blankCount + 2) {
                const randomWord = validWords[Math.floor(Math.random() * validWords.length)];
                if (!options.includes(randomWord)) {
                    options.push(randomWord);
                }
            }
            
            const shuffledOptions = options.sort(() => Math.random() - 0.5);
            optionsEl.innerHTML = shuffledOptions.map(word => {
                const clean = word.toLowerCase().replace(/[^a-z]/g, '');
                return `<span class="exercise-option" data-word="${clean}">${clean}</span>`;
            }).join('');
            
            this.bindExerciseOptions();
        }
    }
    
    bindExerciseOptions() {
        const options = document.querySelectorAll('.exercise-option');
        const blanks = document.querySelectorAll('.exercise-blank');
        
        options.forEach(option => {
            option.addEventListener('click', () => {
                const word = option.dataset.word;
                const emptyBlank = Array.from(blanks).find(b => !b.dataset.filled);
                
                if (emptyBlank) {
                    emptyBlank.textContent = word;
                    emptyBlank.dataset.filled = word;
                    option.classList.add('used');
                }
            });
        });
        
        blanks.forEach(blank => {
            blank.addEventListener('click', () => {
                if (blank.dataset.filled) {
                    const word = blank.dataset.filled;
                    blank.textContent = '_____';
                    delete blank.dataset.filled;
                    
                    const option = document.querySelector(`.exercise-option[data-word="${word}"]`);
                    if (option) {
                        option.classList.remove('used');
                    }
                }
            });
        });
    }
    
    prevExercise() {
        if (this.currentExerciseIndex > 0) {
            this.currentExerciseIndex--;
            this.renderCurrentExercise();
        }
    }
    
    nextExercise() {
        if (this.exerciseQuestions && this.currentExerciseIndex < this.exerciseQuestions.length - 1) {
            this.currentExerciseIndex++;
            this.renderCurrentExercise();
        }
    }
    
    submitExercise() {
        const blanks = document.querySelectorAll('.exercise-blank');
        let correct = 0;
        let total = blanks.length;
        
        blanks.forEach(blank => {
            const answer = blank.dataset.answer;
            const filled = blank.dataset.filled;
            
            blank.classList.remove('correct', 'wrong');
            
            if (filled && filled.toLowerCase() === answer.toLowerCase()) {
                blank.classList.add('correct');
                correct++;
            } else if (filled) {
                blank.classList.add('wrong');
            }
        });
        
        const questionEl = document.getElementById('exerciseQuestion');
        if (questionEl) {
            const resultHtml = `<div class="exercise-result ${correct === total ? 'success' : 'partial'}">
                ${correct === total ? '🎉 全部正确！' : `正确 ${correct}/${total}`}
            </div>`;
            questionEl.innerHTML += resultHtml;
        }
    }
    
    showExercisePlaceholder(mode) {
        const questionEl = document.getElementById('exerciseQuestion');
        const optionsEl = document.getElementById('exerciseOptions');
        
        const placeholders = {
            'listening-fill': '👂 听力填空功能开发中...\n\n请听音频并填写缺失的单词',
            'word-match': '🔄 词汇匹配功能开发中...\n\n将单词与释义进行配对',
            'listening-repeat': '🎤 听力复述功能开发中...\n\n请复述听到的内容'
        };
        
        if (questionEl) {
            questionEl.innerHTML = `<div class="exercise-placeholder">${placeholders[mode] || '功能开发中...'}</div>`;
        }
        if (optionsEl) {
            optionsEl.innerHTML = '';
        }
    }
    
    showExerciseMessage(message) {
        const questionEl = document.getElementById('exerciseQuestion');
        const optionsEl = document.getElementById('exerciseOptions');
        
        if (questionEl) {
            questionEl.innerHTML = `<div class="exercise-message">${message}</div>`;
        }
        if (optionsEl) {
            optionsEl.innerHTML = '';
        }
    }
    
    bindCategoryCards() {
        const categoryCards = document.querySelectorAll('.category-card');
        
        categoryCards.forEach(card => {
            card.addEventListener('click', () => {
                const category = card.dataset.category;
                this.showCategoryPodcasts(category);
            });
        });
    }
    
    showCategoryPodcasts(category) {
        const filtered = podcastsData.podcasts.filter(p => 
            p.category === category || category === 'all'
        );
        
        this.renderPodcastList(filtered);
        this.navigateTo('podcast');
    }
    
    renderPodcastList(podcasts = podcastsData.podcasts) {
        const podcastList = document.getElementById('podcastList');
        if (!podcastList) return;
        
        podcastList.innerHTML = podcasts.map(podcast => `
            <div class="podcast-item" data-podcast-id="${podcast.id}">
                <div class="podcast-cover">🎧</div>
                <div class="podcast-info">
                    <div class="podcast-title">${podcast.title}</div>
                    <div class="podcast-meta">
                        <span class="podcast-duration">${podcast.duration}</span>
                        <span class="podcast-word-count">${podcast.wordCount} 词</span>
                    </div>
                </div>
            </div>
        `).join('');
        
        podcastList.querySelectorAll('.podcast-item').forEach(item => {
            item.addEventListener('click', () => {
                const podcastId = item.dataset.podcastId;
                this.loadPodcast(podcastId);
            });
        });
    }
    
    bindRecommendCards() {
        const recommendCards = document.querySelectorAll('.recommend-card');
        
        recommendCards.forEach((card, index) => {
            card.addEventListener('click', () => {
                if (index === 0 && podcastsData.podcasts.length > 0) {
                    this.loadPodcast(podcastsData.podcasts[0].id);
                } else {
                    this.navigateTo('podcast');
                }
            });
        });
    }
    
    async loadPodcast(podcastId) {
        const podcast = podcastsData.podcasts.find(p => p.id === podcastId);
        
        if (!podcast) {
            console.error('[App] 未找到播客:', podcastId);
            return;
        }
        
        this.currentPodcast = podcast;
        Store.set('currentPodcast', podcast);
        
        const titleEl = document.getElementById('podcastDetailTitle');
        if (titleEl) {
            titleEl.textContent = podcast.title;
        }
        
        const audioSrc = ENV.getAudioPath(podcast.audioFile);
        if (this.player) {
            this.player.load(audioSrc);
        }
        
        // 加载双语字幕
        const subtitleSrc = ENV.getSubtitlePath(podcast.subtitleFile);
        const subtitleSrcZh = podcast.subtitleFileZh ? ENV.getSubtitlePath(podcast.subtitleFileZh) : null;
        
        if (this.subtitleManager) {
            try {
                await this.subtitleManager.loadBilingual(subtitleSrc, subtitleSrcZh, 'srt');
            } catch (err) {
                console.error('[App] 字幕加载失败:', err);
            }
        }
        
        this.navigateTo('podcastDetail');
    }
    
    bindMoreMenu() {
        const moreBtns = document.querySelectorAll('.more-btn');
        
        moreBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const moreMenu = btn.closest('.more-menu');
                if (moreMenu) {
                    moreMenu.classList.toggle('open');
                }
            });
        });
        
        document.addEventListener('click', () => {
            document.querySelectorAll('.more-menu').forEach(menu => {
                menu.classList.remove('open');
            });
        });
    }
    
    bindWordTrainButton() {
        const wordTrainBtn = document.getElementById('wordTrainBtn');
        if (wordTrainBtn) {
            wordTrainBtn.addEventListener('click', () => {
                if (this.wordFillTraining) {
                    this.wordFillTraining.startExercise();
                }
            });
        }
    }
    
    bindTestPage() {
        const audioFileInput = document.getElementById('testAudioFile');
        const subtitleFileInput = document.getElementById('testSubtitleFile');
        const loadFilesBtn = document.getElementById('loadTestFilesBtn');
        
        if (loadFilesBtn) {
            loadFilesBtn.addEventListener('click', () => {
                this.loadTestFiles();
            });
        }
        
        const testWordTrainBtn = document.getElementById('testWordTrainBtn');
        if (testWordTrainBtn) {
            testWordTrainBtn.addEventListener('click', () => {
                if (this.wordFillTraining) {
                    this.wordFillTraining.startExercise();
                }
            });
        }
    }
    
    loadTestFiles() {
        const audioFileInput = document.getElementById('testAudioFile');
        const subtitleFileInput = document.getElementById('testSubtitleFile');
        
        if (!audioFileInput || !subtitleFileInput) return;
        
        const audioFile = audioFileInput.files[0];
        const subtitleFile = subtitleFileInput.files[0];
        
        if (audioFile) {
            const audioUrl = URL.createObjectURL(audioFile);
            const testAudio = document.getElementById('testAudio');
            if (testAudio) {
                testAudio.src = audioUrl;
                testAudio.load();
            }
        }
        
        if (subtitleFile) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target.result;
                if (this.subtitleManager) {
                    this.subtitleManager.load(content, 'srt');
                }
            };
            reader.readAsText(subtitleFile);
        }
    }
}

const app = new BeelistenApp();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.init());
} else {
    app.init();
}

window.Beelisten = {
    app,
    Player,
    SubtitleManager,
    Dictionary,
    WordFillComponent,
    Store,
    podcastsData
};

export default app;
