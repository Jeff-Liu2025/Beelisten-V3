/**
 * SRT字幕解析器 - Beelisten v2
 * 支持解析SRT格式字幕文件
 */

export function parseSRT(text) {
    if (!text || typeof text !== 'string') {
        return [];
    }
    
    const subtitles = [];
    const blocks = text.trim().split(/\n\s*\n/);
    
    for (const block of blocks) {
        const lines = block.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) continue;
        
        const timeLine = lines[1];
        const timeMatch = timeLine.match(
            /(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})/
        );
        
        if (!timeMatch) continue;
        
        const startTime = parseInt(timeMatch[1]) * 3600 
                        + parseInt(timeMatch[2]) * 60 
                        + parseInt(timeMatch[3]) 
                        + parseInt(timeMatch[4]) / 1000;
        
        const endTime = parseInt(timeMatch[5]) * 3600 
                      + parseInt(timeMatch[6]) * 60 
                      + parseInt(timeMatch[7]) 
                      + parseInt(timeMatch[8]) / 1000;
        
        const content = lines.slice(2).join(' ').trim();
        
        if (content) {
            subtitles.push({
                startTime,
                endTime,
                content,
                index: subtitles.length
            });
        }
    }
    
    return subtitles.sort((a, b) => a.startTime - b.startTime);
}

export function parseVTT(text) {
    if (!text || typeof text !== 'string') {
        return [];
    }
    
    const subtitles = [];
    const lines = text.split('\n');
    let i = 0;
    
    while (i < lines.length && !lines[i].includes('-->')) {
        i++;
    }
    
    const timeRegex = /(\d{2}):(\d{2})\.(\d{3})\s*-->\s*(\d{2}):(\d{2})\.(\d{3})/;
    
    for (; i < lines.length; i++) {
        const match = lines[i].match(timeRegex);
        
        if (match) {
            const startTime = parseInt(match[1]) * 60 
                            + parseInt(match[2]) 
                            + parseInt(match[3]) / 1000;
            
            const endTime = parseInt(match[4]) * 60 
                          + parseInt(match[5]) 
                          + parseInt(match[6]) / 1000;
            
            const content = lines[i + 1] ? lines[i + 1].trim() : '';
            
            if (content) {
                subtitles.push({
                    startTime,
                    endTime,
                    content,
                    index: subtitles.length
                });
            }
            
            i++;
        }
    }
    
    return subtitles.sort((a, b) => a.startTime - b.startTime);
}

export function parseLRC(text) {
    if (!text || typeof text !== 'string') {
        return [];
    }
    
    const subtitles = [];
    const lines = text.split('\n');
    const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;
    
    for (const line of lines) {
        const match = line.match(timeRegex);
        
        if (match) {
            const minutes = parseInt(match[1]);
            const seconds = parseInt(match[2]);
            const milliseconds = parseInt(match[3].padEnd(3, '0'));
            const time = minutes * 60 + seconds + milliseconds / 1000;
            const content = line.replace(timeRegex, '').trim();
            
            if (content) {
                subtitles.push({
                    startTime: time,
                    endTime: time + 3,
                    content,
                    index: subtitles.length
                });
            }
        }
    }
    
    return subtitles.sort((a, b) => a.startTime - b.startTime);
}

export function detectFormat(text) {
    if (text.includes('WEBVTT')) return 'vtt';
    if (text.match(/\d{2}:\d{2}:\d{2},\d{3}\s*-->/)) return 'srt';
    if (text.match(/\[\d{2}:\d{2}\.\d{2,3}\]/)) return 'lrc';
    return 'srt';
}

export function parseSubtitle(text, format = 'auto') {
    if (format === 'auto') {
        format = detectFormat(text);
    }
    
    switch (format.toLowerCase()) {
        case 'srt':
            return parseSRT(text);
        case 'vtt':
            return parseVTT(text);
        case 'lrc':
            return parseLRC(text);
        default:
            return parseSRT(text);
    }
}
