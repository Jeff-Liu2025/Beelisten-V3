/**
 * 分段管理器
 * 负责字幕分段、分段切换、进度保存等操作
 */

import { smartSegment } from '../utils/audio-segment.js';
import { saveProgress, loadProgress, clearProgress } from '../store/training-progress.js';

export class SegmentManager {
    constructor(subtitles, resourceId) {
        this.subtitles = subtitles;
        this.resourceId = resourceId;
        this.segments = [];
        this.currentSegmentIndex = 0;
        this.currentSentenceIndex = 0;
    }
    
    /**
     * 初始化分段
     */
    initSegments() {
        this.segments = smartSegment(this.subtitles);
        console.log('[SegmentManager] 分段完成:', this.segments.length, '个分段');
    }
    
    /**
     * 获取当前分段
     * @returns {Object|null} 当前分段对象
     */
    getCurrentSegment() {
        return this.segments[this.currentSegmentIndex];
    }
    
    /**
     * 获取当前句子
     * @returns {Object|null} 当前句子对象
     */
    getCurrentSentence() {
        const segment = this.getCurrentSegment();
        if (!segment) return null;
        return segment.subtitles[this.currentSentenceIndex];
    }
    
    /**
     * 开始指定分段
     * @param {number} index - 分段索引
     * @returns {boolean} 是否成功开始
     */
    startSegment(index) {
        if (index >= this.segments.length) {
            return false;
        }
        
        this.currentSegmentIndex = index;
        this.currentSentenceIndex = 0;
        this.saveProgress();
        return true;
    }
    
    /**
     * 进入下一句
     * @returns {boolean} 是否成功进入下一句
     */
    nextSentence() {
        const segment = this.getCurrentSegment();
        if (!segment) return false;
        
        this.currentSentenceIndex++;
        
        if (this.currentSentenceIndex >= segment.subtitles.length) {
            return this.nextSegment();
        }
        
        this.saveProgress();
        return true;
    }
    
    /**
     * 进入下一分段
     * @returns {boolean} 是否成功进入下一分段
     */
    nextSegment() {
        return this.startSegment(this.currentSegmentIndex + 1);
    }
    
    /**
     * 保存进度
     */
    saveProgress() {
        saveProgress(this.resourceId, {
            segmentIndex: this.currentSegmentIndex,
            totalSegments: this.segments.length,
            currentSentence: this.currentSentenceIndex
        });
    }
    
    /**
     * 恢复进度
     * @returns {boolean} 是否成功恢复
     */
    restoreProgress() {
        const progress = loadProgress(this.resourceId);
        if (progress) {
            this.currentSegmentIndex = progress.segmentIndex || 0;
            this.currentSentenceIndex = progress.currentSentence || 0;
            return true;
        }
        return false;
    }
    
    /**
     * 清除进度
     */
    clearProgress() {
        clearProgress(this.resourceId);
    }
    
    /**
     * 获取进度信息
     * @returns {Object} 进度信息对象
     */
    getProgress() {
        return {
            currentSegment: this.currentSegmentIndex + 1,
            totalSegments: this.segments.length,
            currentSentence: this.currentSentenceIndex + 1,
            totalSentences: this.getCurrentSegment()?.subtitles.length || 0
        };
    }
}

export default SegmentManager;
