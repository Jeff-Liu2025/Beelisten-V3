/**
 * 词块填空训练 - 资源选择页面
 * 显示可用听力资源列表和分段信息，支持进度恢复
 */

import { podcastsData } from './podcasts-data.js';
import { parseSRT } from './utils/srtParser.js';
import { smartSegment, formatSegmentDuration } from './utils/audio-segment.js';
import { loadProgress, hasUnfinishedTraining, getProgressPercentage } from './store/training-progress.js';

class WordFillSelect {
    constructor() {
        this.resourceList = document.getElementById('resourceList');
        this.subtitles = [];
        this.segments = [];
        this.init();
    }
    
    async init() {
        console.log('[WordFillSelect] 初始化资源选择页面');
        this.bindNavigation();
        await this.checkUnfinishedTraining();
        this.renderResourceList();
    }
    
    /**
     * 检查是否有未完成的训练
     */
    async checkUnfinishedTraining() {
        const unfinishedList = document.getElementById('unfinishedList');
        if (!unfinishedList) return;
        
        const resources = podcastsData.podcasts;
        const unfinished = [];
        
        for (const resource of resources) {
            if (hasUnfinishedTraining(resource.id)) {
                const progress = loadProgress(resource.id);
                if (progress) {
                    unfinished.push({
                        resource,
                        progress
                    });
                }
            }
        }
        
        if (unfinished.length > 0) {
            unfinishedList.innerHTML = unfinished.map(item => `
                <div class="unfinished-card" data-resource-id="${item.resource.id}">
                    <div class="unfinished-icon">📝</div>
                    <div class="unfinished-info">
                        <div class="unfinished-title">${item.resource.title}</div>
                        <div class="unfinished-progress">
                            进度: ${item.progress.segmentIndex + 1}/${item.progress.totalSegments} 
                            (${getProgressPercentage(item.resource.id)}%)
                        </div>
                    </div>
                    <button class="continue-btn">继续训练</button>
                </div>
            `).join('');
            
            unfinishedList.classList.remove('hidden');
            
            // 绑定继续训练按钮
            unfinishedList.querySelectorAll('.continue-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const card = e.target.closest('.unfinished-card');
                    const resourceId = card.dataset.resourceId;
                    this.selectResource(resourceId, true);
                });
            });
        }
    }
    
    /**
     * 渲染资源列表
     */
    renderResourceList() {
        if (!this.resourceList) return;
        
        const resources = podcastsData.podcasts;
        
        if (resources.length === 0) {
            this.resourceList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📭</div>
                    <div class="empty-text">暂无可用资源</div>
                </div>
            `;
            return;
        }
        
        this.resourceList.innerHTML = resources.map(resource => `
            <div class="resource-card" data-resource-id="${resource.id}">
                <div class="resource-card-header">
                    <div class="resource-icon">🎧</div>
                    <div class="resource-info">
                        <div class="resource-title">${resource.title}</div>
                        <div class="resource-meta">
                            <span class="resource-duration">⏱️ ${resource.duration}</span>
                            <span class="resource-words">📝 ${resource.wordCount} 词</span>
                            <span class="resource-difficulty">${this.getDifficultyLabel(resource.difficulty)}</span>
                        </div>
                    </div>
                    ${hasUnfinishedTraining(resource.id) ? 
                        `<div class="progress-badge">${getProgressPercentage(resource.id)}%</div>` : ''}
                </div>
                <div class="resource-segments hidden" id="segments-${resource.id}">
                    <div class="segments-loading">加载中...</div>
                </div>
            </div>
        `).join('');
        
        // 绑定点击事件
        this.resourceList.querySelectorAll('.resource-card').forEach(card => {
            card.addEventListener('click', async (e) => {
                if (e.target.classList.contains('segment-item')) return;
                
                const resourceId = card.dataset.resourceId;
                await this.toggleSegments(resourceId, card);
            });
        });
    }
    
    /**
     * 切换分段显示
     */
    async toggleSegments(resourceId, card) {
        const segmentsEl = document.getElementById(`segments-${resourceId}`);
        if (!segmentsEl) return;
        
        // 如果已经显示，隐藏
        if (!segmentsEl.classList.contains('hidden')) {
            segmentsEl.classList.add('hidden');
            return;
        }
        
        // 隐藏其他资源的分段
        document.querySelectorAll('.resource-segments').forEach(el => {
            el.classList.add('hidden');
        });
        
        // 加载分段
        const resource = podcastsData.podcasts.find(r => r.id === resourceId);
        if (!resource) return;
        
        try {
            // 加载字幕
            const response = await fetch(`../听力资源/${resource.subtitleFile}`);
            const srtContent = await response.text();
            const subtitles = parseSRT(srtContent);
            
            // 智能分段
            const segments = smartSegment(subtitles);
            
            // 渲染分段列表
            segmentsEl.innerHTML = this.renderSegmentList(segments, resourceId);
            segmentsEl.classList.remove('hidden');
            
            // 绑定分段点击事件
            segmentsEl.querySelectorAll('.segment-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const segmentIndex = parseInt(item.dataset.segmentIndex);
                    this.selectResource(resourceId, false, segmentIndex);
                });
            });
            
        } catch (err) {
            console.error('[WordFillSelect] 加载分段失败:', err);
            segmentsEl.innerHTML = `<div class="segments-error">加载失败</div>`;
            segmentsEl.classList.remove('hidden');
        }
    }
    
    /**
     * 渲染分段列表
     */
    renderSegmentList(segments, resourceId) {
        const progress = loadProgress(resourceId);
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
    
    /**
     * 获取难度标签
     */
    getDifficultyLabel(difficulty) {
        const labels = {
            'easy': '🟢 简单',
            'medium': '🟡 中等',
            'hard': '🔴 困难'
        };
        return labels[difficulty] || '🟡 中等';
    }
    
    /**
     * 选择资源，跳转到训练页面
     */
    selectResource(resourceId, continueProgress = false, segmentIndex = null) {
        const resource = podcastsData.podcasts.find(r => r.id === resourceId);
        
        if (!resource) {
            console.error('[WordFillSelect] 未找到资源:', resourceId);
            return;
        }
        
        // 存储选中的资源信息到 sessionStorage
        sessionStorage.setItem('wordFillResource', JSON.stringify({
            id: resource.id,
            title: resource.title,
            audioFile: resource.audioFile,
            subtitleFile: resource.subtitleFile,
            subtitleFileZh: resource.subtitleFileZh,
            duration: resource.duration,
            wordCount: resource.wordCount,
            continueProgress,
            startSegmentIndex: segmentIndex
        }));
        
        console.log('[WordFillSelect] 选择资源:', resource.title, 
                    continueProgress ? '(继续)' : '', 
                    segmentIndex !== null ? `分段${segmentIndex}` : '');
        
        // 跳转到训练页面
        window.location.href = 'word-fill-training.html';
    }
    
    /**
     * 绑定侧边栏导航
     */
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

// 初始化
const selectPage = new WordFillSelect();
export default selectPage;
