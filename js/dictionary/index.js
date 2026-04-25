/**
 * 查词模块 - Beelisten v2
 * 支持双击查词、划词查词，使用免费词典API
 */

class Dictionary {
    constructor(options = {}) {
        this.options = {
            popupId: 'dictPopup',
            wordId: 'dictWord',
            phoneticId: 'dictPhonetic',
            contentId: 'dictContent',
            closeId: 'dictClose',
            apiEndpoint: 'https://api.dictionaryapi.dev/api/v2/entries/en/',
            ...options
        };
        
        this.popup = null;
        this.cache = new Map();
        
        this.init();
    }
    
    init() {
        this.popup = document.getElementById(this.options.popupId);
        
        if (!this.popup) {
            console.warn('[Dictionary] 未找到弹窗元素:', this.options.popupId);
            return;
        }
        
        this.bindEvents();
        console.log('[Dictionary] 初始化完成');
    }
    
    bindEvents() {
        document.addEventListener('word-lookup', (e) => {
            this.lookup(e.detail.word, e.detail.x, e.detail.y);
        });
        
        document.addEventListener('dblclick', (e) => {
            if (e.target.closest(`#${this.options.popupId}`)) return;
            
            const word = this.getSelectedWord(e);
            if (word) {
                this.lookup(word, e.clientX, e.clientY);
            }
        });
        
        const closeBtn = document.getElementById(this.options.closeId);
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hide());
        }
        
        document.addEventListener('click', (e) => {
            if (!this.popup) return;
            
            if (!this.popup.contains(e.target) && 
                !e.target.closest('.subtitle-item') &&
                window.getSelection().toString().trim() === '') {
                this.hide();
            }
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hide();
            }
        });
    }
    
    getSelectedWord(e) {
        const selection = window.getSelection();
        const text = selection.toString().trim();
        
        if (text && /^[a-zA-Z]+$/.test(text) && text.length >= 2 && text.length <= 20) {
            return text.toLowerCase();
        }
        
        const target = e.target;
        if (target.classList.contains('original-text') || 
            target.classList.contains('subtitle-item')) {
            const text = target.textContent.trim();
            const words = text.split(/\s+/);
            
            const clickedWord = this.getWordAtPosition(target, e.offsetX);
            if (clickedWord) {
                return clickedWord.toLowerCase();
            }
        }
        
        return null;
    }
    
    getWordAtPosition(element, x) {
        // 只处理原始文本节点，忽略翻译文本
        const originalTextEl = element.querySelector('.original-text') || element;
        const textNode = originalTextEl.firstChild;
        
        if (!textNode || textNode.nodeType !== Node.TEXT_NODE) {
            return null;
        }
        
        const text = textNode.textContent;
        if (!text || text.length === 0) {
            return null;
        }
        
        const range = document.createRange();
        
        try {
            for (let i = 0; i < text.length; i++) {
                range.setStart(textNode, i);
                range.setEnd(textNode, Math.min(i + 1, text.length));
                
                const rects = range.getClientRects();
                for (const rect of rects) {
                    if (x >= rect.left - element.getBoundingClientRect().left && 
                        x <= rect.right - element.getBoundingClientRect().left) {
                        const char = text[i];
                        if (/[a-zA-Z]/.test(char)) {
                            let start = i;
                            let end = i;
                            
                            while (start > 0 && /[a-zA-Z]/.test(text[start - 1])) start--;
                            while (end < text.length && /[a-zA-Z]/.test(text[end])) end++;
                            
                            return text.substring(start, end);
                        }
                    }
                }
            }
        } catch (err) {
            console.warn('[Dictionary] getWordAtPosition error:', err);
        }
        
        return null;
    }
    
    async lookup(word, x, y) {
        if (!word) return;
        
        word = word.toLowerCase().replace(/[^a-z]/g, '');
        if (!word) return;
        
        if (this.cache.has(word)) {
            this.showResult(this.cache.get(word), x, y);
            return;
        }
        
        this.showLoading(word, x, y);
        
        try {
            const response = await fetch(this.options.apiEndpoint + encodeURIComponent(word));
            
            if (!response.ok) {
                throw new Error('Word not found');
            }
            
            const data = await response.json();
            
            if (data && data.length > 0) {
                this.cache.set(word, data[0]);
                this.showResult(data[0], x, y);
            } else {
                this.showError(word, x, y);
            }
        } catch (err) {
            console.error('[Dictionary] 查询失败:', err);
            this.showError(word, x, y);
        }
    }
    
    showLoading(word, x, y) {
        if (!this.popup) return;
        
        const wordEl = document.getElementById(this.options.wordId);
        const phoneticEl = document.getElementById(this.options.phoneticId);
        const contentEl = document.getElementById(this.options.contentId);
        
        if (wordEl) wordEl.textContent = word;
        if (phoneticEl) phoneticEl.textContent = '';
        if (contentEl) contentEl.innerHTML = '<div class="dict-loading">查询中...</div>';
        
        this.show(x, y);
    }
    
    showResult(data, x, y) {
        if (!this.popup) return;
        
        const wordEl = document.getElementById(this.options.wordId);
        const phoneticEl = document.getElementById(this.options.phoneticId);
        const contentEl = document.getElementById(this.options.contentId);
        
        if (wordEl) wordEl.textContent = data.word;
        
        const phonetics = data.phonetics || [];
        const phoneticText = phonetics.find(p => p.text)?.text || '';
        const audioUrl = phonetics.find(p => p.audio)?.audio || '';
        
        if (phoneticEl) {
            phoneticEl.textContent = phoneticText;
        }
        
        const meanings = data.meanings || [];
        let html = '';
        
        meanings.slice(0, 3).forEach(meaning => {
            html += `<div class="dict-meaning">`;
            html += `<div class="dict-part-of-speech">${meaning.partOfSpeech}</div>`;
            
            const definitions = meaning.definitions || [];
            definitions.slice(0, 2).forEach(def => {
                html += `<div class="dict-definition">${def.definition}</div>`;
                
                if (def.example) {
                    html += `<div class="dict-example">"${def.example}"</div>`;
                }
            });
            
            html += `</div>`;
        });
        
        if (audioUrl) {
            html = `
                <button class="dict-audio-btn" data-audio="${audioUrl}" title="播放发音">
                    🔊 发音
                </button>
            ` + html;
        }
        
        if (contentEl) {
            contentEl.innerHTML = html;
            
            const audioBtn = contentEl.querySelector('.dict-audio-btn');
            if (audioBtn) {
                audioBtn.addEventListener('click', () => {
                    const audio = new Audio(audioBtn.dataset.audio);
                    audio.play().catch(err => console.error('[Dictionary] 音频播放失败:', err));
                });
            }
        }
        
        this.show(x, y);
    }
    
    showError(word, x, y) {
        if (!this.popup) return;
        
        const wordEl = document.getElementById(this.options.wordId);
        const phoneticEl = document.getElementById(this.options.phoneticId);
        const contentEl = document.getElementById(this.options.contentId);
        
        if (wordEl) wordEl.textContent = word;
        if (phoneticEl) phoneticEl.textContent = '';
        if (contentEl) {
            contentEl.innerHTML = `
                <div class="dict-error">
                    <p>未找到 "${word}" 的释义</p>
                    <p style="font-size: 12px; color: #888; margin-top: 8px;">
                        可能是网络问题或该词不在词典中
                    </p>
                </div>
            `;
        }
        
        this.show(x, y);
    }
    
    show(x, y) {
        if (!this.popup) return;
        
        this.popup.classList.add('show');
        
        if (x !== undefined && y !== undefined) {
            const rect = this.popup.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            
            let left = x + 10;
            let top = y + 10;
            
            if (left + rect.width > viewportWidth - 20) {
                left = x - rect.width - 10;
            }
            
            if (top + rect.height > viewportHeight - 20) {
                top = y - rect.height - 10;
            }
            
            left = Math.max(10, left);
            top = Math.max(10, top);
            
            this.popup.style.left = `${left}px`;
            this.popup.style.top = `${top}px`;
        }
    }
    
    hide() {
        if (!this.popup) return;
        
        this.popup.classList.remove('show');
    }
}

export function createDictionary(options) {
    return new Dictionary(options);
}

export default Dictionary;
