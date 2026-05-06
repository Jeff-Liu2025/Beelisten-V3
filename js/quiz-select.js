/**
 * 精听测验 - 资源选择页面
 * 使用和词块填空一样的分段逻辑
 */

import { podcastsData } from './podcasts-data.js';
import { parseSRT } from './utils/srtParser.js';
import { smartSegment, formatSegmentDuration } from './utils/audio-segment.js';
import { loadProgress, hasUnfinishedTraining, getProgressPercentage } from './store/training-progress.js';

class QuizSelect {
    constructor() {
        this.resourceList = document.getElementById('resourceList');
        this.init();
    }
    
    async init() {
        console.log('[QuizSelect] 初始化资源选择页面');
        this.bindNavigation();
        this.renderResourceList();
    }
    
    renderResourceList() {
        if (!this.resourceList) return;
        
        const resources = podcastsData.podcasts.filter(r => r.category === 'exam' && r.questionsFile);
        
        if (resources.length === 0) {
            this.resourceList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📭</div>
                    <div class="empty-text">暂无精听测验资源</div>
                    <div class="empty-hint">精听测验需要配置题目文件</div>
                </div>
            `;
            return;
        }
        
        this.resourceList.innerHTML = resources.map(resource => `
            <div class="resource-card" data-resource-id="${resource.id}" data-category="${resource.category || 'podcast'}">
                <div class="resource-card-header">
                    <div class="resource-icon">📋</div>
                    <div class="resource-info">
                        <div class="resource-title">${resource.title}</div>
                        <div class="resource-meta">
                            <span class="resource-duration">⏱️ ${resource.duration}</span>
                            <span class="resource-words">📝 ${resource.wordCount} 词</span>
                            <span class="resource-difficulty">${this.getDifficultyLabel(resource.difficulty)}</span>
                        </div>
                    </div>
                    ${hasUnfinishedTraining(resource.id, 'quiz-listen') ? 
                        `<div class="progress-badge">${getProgressPercentage(resource.id, 'quiz-listen')}%</div>` : ''}
                </div>
                <div class="resource-segments hidden" id="segments-${resource.id}">
                    <div class="segments-loading">加载中...</div>
                </div>
            </div>
        `).join('');
        
        this.resourceList.querySelectorAll('.resource-card').forEach(card => {
            card.addEventListener('click', async (e) => {
                if (e.target.classList.contains('segment-item') || e.target.classList.contains('train-all-btn')) return;
                
                const resourceId = card.dataset.resourceId;
                await this.toggleSegments(resourceId, card);
            });
        });
    }
    
    async toggleSegments(resourceId, card) {
        const segmentsEl = document.getElementById(`segments-${resourceId}`);
        if (!segmentsEl) return;
        
        if (!segmentsEl.classList.contains('hidden')) {
            segmentsEl.classList.add('hidden');
            return;
        }
        
        document.querySelectorAll('.resource-segments').forEach(el => {
            el.classList.add('hidden');
        });
        
        const resource = podcastsData.podcasts.find(r => r.id === resourceId);
        if (!resource) return;
        
        if (resource.category === 'exam' && resource.questionsFile) {
            try {
                const response = await fetch(`${resource.questionsFile}`);
                const data = await response.json();
                const passages = data.passages || [];
                
                segmentsEl.innerHTML = this.renderPassageList(passages, resourceId, resource);
                segmentsEl.classList.remove('hidden');
                
                segmentsEl.querySelectorAll('.segment-item').forEach(item => {
                    item.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const passageIndex = parseInt(item.dataset.segmentIndex);
                        console.log('[QuizSelect] 点击段落, passageIndex:', passageIndex);
                        this.selectResource(resourceId, passageIndex);
                    });
                });
                
                segmentsEl.querySelectorAll('.train-all-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.selectResource(resourceId, 0);
                    });
                });
                
            } catch (err) {
                console.error('[QuizSelect] 加载题目文件失败:', err);
                segmentsEl.innerHTML = `<div class="segments-error">加载失败</div>`;
                segmentsEl.classList.remove('hidden');
            }
        } else {
            try {
                const response = await fetch(`../听力资源/${resource.subtitleFile}`);
                const srtContent = await response.text();
                const subtitles = parseSRT(srtContent);
                
                const segments = smartSegment(subtitles);
                
                segmentsEl.innerHTML = this.renderSegmentList(segments, resourceId, resource);
                segmentsEl.classList.remove('hidden');
                
                segmentsEl.querySelectorAll('.segment-item').forEach(item => {
                    item.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const segmentIndex = parseInt(item.dataset.segmentIndex);
                        console.log('[QuizSelect] 点击分段, segmentIndex:', segmentIndex);
                        this.selectResource(resourceId, segmentIndex);
                    });
                });
                
                segmentsEl.querySelectorAll('.train-all-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.selectResource(resourceId, null);
                    });
                });
                
            } catch (err) {
                console.error('[QuizSelect] 加载分段失败:', err);
                segmentsEl.innerHTML = `<div class="segments-error">加载失败</div>`;
                segmentsEl.classList.remove('hidden');
            }
        }
    }
    
    renderPassageList(passages, resourceId, resource) {
        const progress = loadProgress(resourceId, 'quiz-listen');
        const currentPassageIndex = progress?.segmentIndex || 0;
        
        return `
            <div class="segments-header">
                <span>共 ${passages.length} 个段落</span>
                <button class="train-all-btn" data-resource-id="${resourceId}">开始测验</button>
            </div>
            <div class="segments-list">
                ${passages.map((passage, index) => `
                    <div class="segment-item ${index < currentPassageIndex ? 'completed' : ''} ${index === currentPassageIndex ? 'current' : ''}" 
                         data-segment-index="${index}">
                        <div class="segment-name">${passage.passageName}</div>
                        <div class="segment-info">
                            <span>${passage.questions?.length || 0} 题</span>
                        </div>
                        ${index < currentPassageIndex ? '<span class="segment-check">✓</span>' : ''}
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    renderSegmentList(segments, resourceId, resource) {
        const isExam = resource.category === 'exam';
        const progress = loadProgress(resourceId, 'quiz-listen');
        const currentSegmentIndex = progress?.segmentIndex || 0;
        
        return `
            <div class="segments-header">
                <span>共 ${segments.length} 个分段</span>
                <button class="train-all-btn" data-resource-id="${resourceId}">全部训练</button>
            </div>
            <div class="segments-list">
                ${segments.map((seg, index) => `
                    <div class="segment-item ${index < currentSegmentIndex ? 'completed' : ''} ${index === currentSegmentIndex ? 'current' : ''}" 
                         data-segment-index="${index}">
                        <div class="segment-name">${seg.displayName}</div>
                        <div class="segment-info">
                            <span>${seg.subtitles?.length || 0} 句</span>
                            <span>${formatSegmentDuration(seg.duration)}</span>
                        </div>
                        ${index < currentSegmentIndex ? '<span class="segment-check">✓</span>' : ''}
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    getDifficultyLabel(difficulty) {
        const labels = {
            'easy': '🟢 简单',
            'medium': '🟡 中等',
            'hard': '🔴 困难'
        };
        return labels[difficulty] || '🟡 中等';
    }
    
    selectResource(resourceId, segmentIndex = null) {
        const resource = podcastsData.podcasts.find(r => r.id === resourceId);
        
        if (!resource) {
            console.error('[QuizSelect] 未找到资源:', resourceId);
            return;
        }
        
        sessionStorage.setItem('quizResource', JSON.stringify({
            id: resource.id,
            title: resource.title,
            audioFile: resource.audioFile,
            subtitleFile: resource.subtitleFile,
            subtitleFileZh: resource.subtitleFileZh,
            duration: resource.duration,
            wordCount: resource.wordCount,
            category: resource.category || 'podcast',
            questionsFile: resource.questionsFile,
            startSegmentIndex: segmentIndex
        }));
        
        console.log('[QuizSelect] 选择资源:', resource.title, segmentIndex !== null ? `分段${segmentIndex}` : '');
        
        window.location.href = 'quiz-training.html';
    }
    
    bindNavigation() {
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
}

const selectPage = new QuizSelect();
export default selectPage;
