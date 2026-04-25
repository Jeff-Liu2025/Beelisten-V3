/**
 * 音频分段工具 - Beelisten v2
 * 支持基于内容的智能分段和普通分段
 */

/**
 * 分段标记关键词
 */
const SEGMENT_MARKERS = {
    section: /section\s*[abc]/i,
    newsReport: /news\s*report\s*(one|two|three|1|2|3)/i,
    conversation: /conversation\s*(one|two|1|2)/i,
    passage: /passage\s*(one|two|three|1|2|3)/i
};

/**
 * 分段类型名称映射
 */
const SEGMENT_TYPE_NAMES = {
    section: 'Section',
    newsReport: 'News Report',
    conversation: 'Conversation',
    passage: 'Passage'
};

/**
 * 数字英文转中文
 */
const NUMBER_MAP = {
    'one': '1', 'two': '2', 'three': '3', 'four': '4', 'five': '5',
    '1': '1', '2': '2', '3': '3', '4': '4', '5': '5'
};

/**
 * 检测字幕中的分段标记
 * @param {array} subtitles - 字幕数组
 * @returns {array} 分段信息数组
 */
export function detectSegments(subtitles) {
    if (!subtitles || subtitles.length === 0) {
        return [];
    }
    
    console.log('[AudioSegment] 开始检测分段，字幕总数:', subtitles.length);
    
    const segments = [];
    let currentSection = null;
    let segmentIndex = 0;
    
    subtitles.forEach((subtitle, index) => {
        const content = subtitle.content.toLowerCase();
        
        const sectionMatch = content.match(SEGMENT_MARKERS.section);
        if (sectionMatch) {
            const sectionLetter = sectionMatch[0].match(/[abc]/i)[0].toUpperCase();
            currentSection = `Section ${sectionLetter}`;
            console.log(`[AudioSegment] 检测到Section标记: ${currentSection} at subtitle index ${index}, content: "${subtitle.content}"`);
            return;
        }
        
        const newsMatch = content.match(SEGMENT_MARKERS.newsReport);
        if (newsMatch) {
            const num = NUMBER_MAP[newsMatch[1].toLowerCase()] || newsMatch[1];
            const section = currentSection || 'Section A';
            console.log(`[AudioSegment] 检测到News Report ${num}, section: ${section}, currentSection: ${currentSection}`);
            segments.push({
                id: `segment-${segmentIndex++}`,
                type: 'newsReport',
                section: section,
                name: `News Report ${num}`,
                displayName: `${section} - News Report ${num}`,
                startIndex: index + 1,
                endIndex: -1,
                startTime: subtitles[index + 1]?.startTime || subtitle.startTime
            });
            return;
        }
        
        const convMatch = content.match(SEGMENT_MARKERS.conversation);
        if (convMatch) {
            const num = NUMBER_MAP[convMatch[1].toLowerCase()] || convMatch[1];
            const section = currentSection || 'Section B';
            console.log(`[AudioSegment] 检测到Conversation ${num}, section: ${section}, currentSection: ${currentSection}`);
            segments.push({
                id: `segment-${segmentIndex++}`,
                type: 'conversation',
                section: section,
                name: `Conversation ${num}`,
                displayName: `${section} - Conversation ${num}`,
                startIndex: index + 1,
                endIndex: -1,
                startTime: subtitles[index + 1]?.startTime || subtitle.startTime
            });
            return;
        }
        
        const passageMatch = content.match(SEGMENT_MARKERS.passage);
        if (passageMatch) {
            const num = NUMBER_MAP[passageMatch[1].toLowerCase()] || passageMatch[1];
            const section = currentSection || 'Section C';
            console.log(`[AudioSegment] 检测到Passage ${num}, section: ${section}, currentSection: ${currentSection}`);
            segments.push({
                id: `segment-${segmentIndex++}`,
                type: 'passage',
                section: section,
                name: `Passage ${num}`,
                displayName: `${section} - Passage ${num}`,
                startIndex: index + 1,
                endIndex: -1,
                startTime: subtitles[index + 1]?.startTime || subtitle.startTime
            });
            return;
        }
    });
    
    console.log('[AudioSegment] 分段检测完成，共检测到', segments.length, '个分段');
    segments.forEach((seg, i) => {
        console.log(`[AudioSegment] 分段${i}: ${seg.displayName}`);
    });
    
    // 设置每个分段的结束索引和时间
    for (let i = 0; i < segments.length; i++) {
        if (i < segments.length - 1) {
            segments[i].endIndex = segments[i + 1].startIndex - 1;
            segments[i].endTime = subtitles[segments[i + 1].startIndex - 1]?.endTime || 0;
        } else {
            segments[i].endIndex = subtitles.length - 1;
            segments[i].endTime = subtitles[subtitles.length - 1]?.endTime || 0;
        }
        
        // 计算分段时长
        segments[i].duration = segments[i].endTime - segments[i].startTime;
        
        // 获取该分段的字幕
        segments[i].subtitles = subtitles.slice(
            segments[i].startIndex, 
            segments[i].endIndex + 1
        );
    }
    
    return segments;
}

/**
 * 普通分段（按句子数量分组）
 * @param {array} subtitles - 字幕数组
 * @param {number} sentencesPerSegment - 每段句子数（默认5）
 * @returns {array} 分段信息数组
 */
export function autoSegment(subtitles, sentencesPerSegment = 5) {
    if (!subtitles || subtitles.length === 0) {
        return [];
    }
    
    const segments = [];
    const totalSegments = Math.ceil(subtitles.length / sentencesPerSegment);
    
    for (let i = 0; i < totalSegments; i++) {
        const startIndex = i * sentencesPerSegment;
        const endIndex = Math.min(startIndex + sentencesPerSegment - 1, subtitles.length - 1);
        
        segments.push({
            id: `segment-${i}`,
            type: 'auto',
            section: null,
            name: `Part ${i + 1}`,
            displayName: `Part ${i + 1}`,
            startIndex,
            endIndex,
            startTime: subtitles[startIndex]?.startTime || 0,
            endTime: subtitles[endIndex]?.endTime || 0,
            duration: (subtitles[endIndex]?.endTime || 0) - (subtitles[startIndex]?.startTime || 0),
            subtitles: subtitles.slice(startIndex, endIndex + 1)
        });
    }
    
    return segments;
}

/**
 * 智能分段 - 自动选择最佳分段方式
 * @param {array} subtitles - 字幕数组
 * @returns {array} 分段信息数组
 */
export function smartSegment(subtitles) {
    if (!subtitles || subtitles.length === 0) {
        return [];
    }
    
    // 首先尝试检测内容分段标记
    const contentSegments = detectSegments(subtitles);
    
    // 如果检测到分段标记，使用智能分段
    if (contentSegments.length > 0) {
        console.log('[AudioSegment] 使用智能分段，检测到', contentSegments.length, '个分段');
        return contentSegments;
    }
    
    // 否则使用普通分段
    console.log('[AudioSegment] 使用普通分段');
    return autoSegment(subtitles);
}

/**
 * 格式化分段时长显示
 * @param {number} seconds - 秒数
 * @returns {string} 格式化的时间字符串
 */
export function formatSegmentDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * 获取分段统计信息
 * @param {array} segments - 分段数组
 * @returns {object} 统计信息
 */
export function getSegmentStats(segments) {
    if (!segments || segments.length === 0) {
        return { total: 0, totalDuration: 0, avgDuration: 0 };
    }
    
    const totalDuration = segments.reduce((sum, seg) => sum + (seg.duration || 0), 0);
    
    return {
        total: segments.length,
        totalDuration,
        avgDuration: totalDuration / segments.length
    };
}

export default {
    detectSegments,
    autoSegment,
    smartSegment,
    formatSegmentDuration,
    getSegmentStats
};
