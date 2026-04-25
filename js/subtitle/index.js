/**
 * 字幕模块 - Beelisten v2
 * 支持SRT解析、字幕高亮、点击跳转
 */

import { parseSubtitle } from '../utils/srtParser.js';
import Store from '../store/index.js';

class SubtitleManager {
    constructor(options = {}) {
        this.options = {
            contentId: 'subtitleContent',
            modeBtnClass: 'subtitle-mode-btn',
            itemClass: 'subtitle-item',
            highlightedClass: 'highlighted',
            originalClass: 'original-text',
            translationClass: 'translation-text',
            ...options
        };
        
        this.subtitles = [];
        this.currentIndex = -1;
        this.mode = 'original';
        this.container = null;
        
        this.init();
    }
    
    init() {
        this.container = document.getElementById(this.options.contentId);
        
        if (!this.container) {
            console.warn('[Subtitle] 未找到字幕容器:', this.options.contentId);
            return;
        }
        
        this.bindEvents();
        console.log('[Subtitle] 初始化完成');
    }
    
    bindEvents() {
        const modeBtns = document.querySelectorAll(`.${this.options.modeBtnClass}`);
        
        modeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.dataset.mode;
                this.setMode(mode);
                
                modeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
        
        document.addEventListener('player-timeupdate', (e) => {
            this.sync(e.detail.currentTime);
        });
        
        if (this.container) {
            this.container.addEventListener('click', (e) => {
                const item = e.target.closest(`.${this.options.itemClass}`);
                if (item) {
                    const startTime = parseFloat(item.dataset.startTime);
                    if (!isNaN(startTime)) {
                        this.onSubtitleClick(startTime, parseInt(item.dataset.index));
                    }
                }
            });
            
            this.container.addEventListener('dblclick', (e) => {
                const word = this.getSelectedWord(e);
                if (word) {
                    document.dispatchEvent(new CustomEvent('word-lookup', {
                        detail: { word, x: e.clientX, y: e.clientY }
                    }));
                }
            });
        }
    }
    
    load(text, format = 'auto') {
        try {
            this.subtitles = parseSubtitle(text, format);
            Store.set('subtitles', this.subtitles);
            this.currentIndex = -1;
            this.render();
            
            document.dispatchEvent(new CustomEvent('subtitles-loaded', {
                detail: { subtitles: this.subtitles }
            }));
            
            console.log('[Subtitle] 加载完成，共', this.subtitles.length, '条');
            return this.subtitles;
        } catch (err) {
            console.error('[Subtitle] 解析失败:', err);
            return [];
        }
    }
    
    loadFromUrl(url, format = 'auto') {
        return fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                return response.text();
            })
            .then(text => this.load(text, format))
            .catch(err => {
                console.error('[Subtitle] 加载失败:', err);
                throw err;
            });
    }
    
    async loadBilingual(enUrl, zhUrl, format = 'auto') {
        try {
            // 加载英文字幕
            const enResponse = await fetch(enUrl);
            if (!enResponse.ok) {
                throw new Error(`英文SRT HTTP ${enResponse.status}`);
            }
            const enText = await enResponse.text();
            const enSubtitles = parseSubtitle(enText, format);
            
            // 加载中文字幕（可选）
            let zhSubtitles = [];
            if (zhUrl) {
                try {
                    const zhResponse = await fetch(zhUrl);
                    if (zhResponse.ok) {
                        const zhText = await zhResponse.text();
                        zhSubtitles = parseSubtitle(zhText, format);
                    }
                } catch (err) {
                    console.warn('[Subtitle] 中文字幕加载失败，使用纯英文模式:', err);
                }
            }
            
            // 合并双语字幕
            this.subtitles = this.mergeBilingualSubtitles(enSubtitles, zhSubtitles);
            Store.set('subtitles', this.subtitles);
            this.currentIndex = -1;
            this.render();
            
            document.dispatchEvent(new CustomEvent('subtitles-loaded', {
                detail: { subtitles: this.subtitles }
            }));
            
            console.log('[Subtitle] 双语字幕加载完成，共', this.subtitles.length, '条');
            return this.subtitles;
        } catch (err) {
            console.error('[Subtitle] 双语字幕加载失败:', err);
            throw err;
        }
    }
    
    mergeBilingualSubtitles(enSubs, zhSubs) {
        return enSubs.map((enSub, index) => {
            const zhSub = zhSubs.find(zh => 
                Math.abs(zh.startTime - enSub.startTime) < 0.5
            );
            
            return {
                ...enSub,
                translation: zhSub ? zhSub.content : ''
            };
        });
    }
    
    render() {
        if (!this.container || this.subtitles.length === 0) {
            if (this.container) {
                this.container.innerHTML = `
                    <div class="empty-subtitles">
                        <p>🎯 字幕将在这里显示</p>
                        <p>点击字幕可以直接跳转到对应时间点</p>
                    </div>
                `;
            }
            return;
        }
        
        const html = this.subtitles.map((sub, index) => {
            let contentHtml = '';
            
            switch (this.mode) {
                case 'original':
                    contentHtml = `<div class="${this.options.originalClass}">${this.escapeHtml(sub.content)}</div>`;
                    break;
                case 'translation':
                    contentHtml = `<div class="${this.options.translationClass}">${this.escapeHtml(sub.translation || sub.content)}</div>`;
                    break;
                case 'both':
                default:
                    contentHtml = `
                        <div class="${this.options.originalClass}">${this.escapeHtml(sub.content)}</div>
                        ${sub.translation ? `<div class="${this.options.translationClass}">${this.escapeHtml(sub.translation)}</div>` : ''}
                    `;
                    break;
            }
            
            return `
                <div class="${this.options.itemClass}" 
                     data-index="${index}" 
                     data-start-time="${sub.startTime}">
                    ${contentHtml}
                </div>
            `;
        }).join('');
        
        this.container.innerHTML = html;
        
        // 恢复当前高亮
        if (this.currentIndex >= 0) {
            this.highlightLine(this.currentIndex);
        }
    }
    
    sync(currentTime) {
        if (this.subtitles.length === 0) return;
        
        let newIndex = -1;
        
        for (let i = this.subtitles.length - 1; i >= 0; i--) {
            const sub = this.subtitles[i];
            if (currentTime >= sub.startTime && currentTime <= sub.endTime) {
                newIndex = i;
                break;
            }
            if (currentTime >= sub.startTime) {
                newIndex = i;
                break;
            }
        }
        
        if (newIndex !== this.currentIndex) {
            this.highlightLine(newIndex);
            this.currentIndex = newIndex;
            Store.set('currentSubtitleIndex', newIndex);
        }
    }
    
    highlightLine(index) {
        if (!this.container) return;
        
        const items = this.container.querySelectorAll(`.${this.options.itemClass}`);
        
        items.forEach(item => item.classList.remove(this.options.highlightedClass));
        
        if (index >= 0 && index < items.length) {
            const item = items[index];
            item.classList.add(this.options.highlightedClass);
            
            item.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }
    
    onSubtitleClick(startTime, index) {
        console.log('[Subtitle] 点击字幕:', { startTime, index, subtitle: this.subtitles[index] });
        document.dispatchEvent(new CustomEvent('subtitle-click', {
            detail: { startTime, index }
        }));
    }
    
    setMode(mode) {
        this.mode = mode;
        Store.set('subtitleMode', mode);
        this.render();
    }
    
    getSelectedWord(e) {
        const selection = window.getSelection();
        const text = selection.toString().trim();
        
        if (text && /^[a-zA-Z]+$/.test(text)) {
            return text.toLowerCase();
        }
        
        return null;
    }
    
    getCurrentSubtitle() {
        if (this.currentIndex >= 0 && this.currentIndex < this.subtitles.length) {
            return this.subtitles[this.currentIndex];
        }
        return null;
    }
    
    getSubtitleByIndex(index) {
        if (index >= 0 && index < this.subtitles.length) {
            return this.subtitles[index];
        }
        return null;
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    clear() {
        this.subtitles = [];
        this.currentIndex = -1;
        if (this.container) {
            this.container.innerHTML = '';
        }
        Store.set('subtitles', []);
    }
}

export function createSubtitleManager(options) {
    return new SubtitleManager(options);
}

export default SubtitleManager;
