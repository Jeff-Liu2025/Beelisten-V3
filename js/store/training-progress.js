/**
 * 训练进度存储模块 - Beelisten v2
 * 使用localStorage保存和恢复训练进度
 * 支持不同训练模式（word-fill, quiz-listen）的独立进度
 */

const STORAGE_KEY = 'beelisten_training_progress';

function getProgressKey(resourceId, mode) {
    return mode ? `${resourceId}_${mode}` : resourceId;
}

/**
 * 获取所有训练进度
 */
function getAllProgress() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : {};
    } catch (err) {
        console.error('[TrainingProgress] 读取进度失败:', err);
        return {};
    }
}

/**
 * 保存所有进度
 */
function saveAllProgress(progressData) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(progressData));
        return true;
    } catch (err) {
        console.error('[TrainingProgress] 保存进度失败:', err);
        return false;
    }
}

/**
 * 保存单个资源的训练进度
 * @param {string} resourceId - 资源ID
 * @param {object} progress - 进度信息
 * @param {number} progress.segmentIndex - 当前分段索引
 * @param {number} progress.totalSegments - 总分段数
 * @param {number} progress.currentSentence - 当前句子索引
 * @param {number} progress.correctCount - 正确数量
 * @param {number} progress.wrongCount - 错误数量
 * @param {string} progress.mode - 训练模式 (word-fill, quiz-listen)
 * @param {number} progress.timestamp - 保存时间戳
 */
export function saveProgress(resourceId, progress) {
    if (!resourceId || !progress) {
        console.warn('[TrainingProgress] 无效的参数');
        return false;
    }
    
    const allProgress = getAllProgress();
    const mode = progress.mode || 'word-fill';
    const key = getProgressKey(resourceId, mode);
    
    allProgress[key] = {
        ...progress,
        resourceId,
        mode,
        timestamp: Date.now()
    };
    
    const result = saveAllProgress(allProgress);
    
    if (result) {
        document.dispatchEvent(new CustomEvent('training-progress-saved', {
            detail: { resourceId, progress: allProgress[key] }
        }));
        console.log('[TrainingProgress] 进度已保存:', key, progress);
    }
    
    return result;
}

/**
 * 加载单个资源的训练进度
 * @param {string} resourceId - 资源ID
 * @param {string} mode - 训练模式 (可选，默认word-fill)
 * @returns {object|null} 进度信息或null
 */
export function loadProgress(resourceId, mode = 'word-fill') {
    if (!resourceId) {
        console.warn('[TrainingProgress] 无效的资源ID');
        return null;
    }
    
    const allProgress = getAllProgress();
    const key = getProgressKey(resourceId, mode);
    const progress = allProgress[key] || null;
    
    if (progress) {
        console.log('[TrainingProgress] 加载进度:', key, progress);
    }
    
    return progress;
}

/**
 * 清除单个资源的训练进度
 * @param {string} resourceId - 资源ID
 * @param {string} mode - 训练模式 (可选)
 */
export function clearProgress(resourceId, mode = null) {
    if (!resourceId) {
        console.warn('[TrainingProgress] 无效的资源ID');
        return false;
    }
    
    const allProgress = getAllProgress();
    
    if (mode) {
        const key = getProgressKey(resourceId, mode);
        if (allProgress[key]) {
            delete allProgress[key];
            saveAllProgress(allProgress);
            console.log('[TrainingProgress] 进度已清除:', key);
        }
    } else {
        Object.keys(allProgress).forEach(key => {
            if (key.startsWith(resourceId)) {
                delete allProgress[key];
            }
        });
        saveAllProgress(allProgress);
        console.log('[TrainingProgress] 所有模式进度已清除:', resourceId);
    }
    
    document.dispatchEvent(new CustomEvent('training-progress-cleared', {
        detail: { resourceId, mode }
    }));
    
    return true;
}

/**
 * 检查是否有未完成的训练
 * @param {string} mode - 可选，筛选特定模式
 * @returns {array} 未完成训练列表
 */
export function getUnfinishedTrainings(mode = null) {
    const allProgress = getAllProgress();
    const unfinished = [];
    
    Object.keys(allProgress).forEach(key => {
        const progress = allProgress[key];
        if (progress && progress.segmentIndex < progress.totalSegments) {
            if (!mode || progress.mode === mode) {
                unfinished.push({
                    key,
                    ...progress
                });
            }
        }
    });
    
    return unfinished.sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * 检查指定资源是否有未完成的训练
 * @param {string} resourceId - 资源ID
 * @param {string} mode - 训练模式 (可选，默认word-fill)
 * @returns {boolean}
 */
export function hasUnfinishedTraining(resourceId, mode = 'word-fill') {
    const progress = loadProgress(resourceId, mode);
    
    if (!progress) return false;
    
    return progress.segmentIndex < progress.totalSegments;
}

/**
 * 获取进度百分比
 * @param {string} resourceId - 资源ID
 * @param {string} mode - 训练模式 (可选，默认word-fill)
 * @returns {number} 0-100的百分比
 */
export function getProgressPercentage(resourceId, mode = 'word-fill') {
    const progress = loadProgress(resourceId, mode);
    
    if (!progress || !progress.totalSegments) return 0;
    
    return Math.round((progress.segmentIndex / progress.totalSegments) * 100);
}

export default {
    saveProgress,
    loadProgress,
    clearProgress,
    getUnfinishedTrainings,
    hasUnfinishedTraining,
    getProgressPercentage
};
