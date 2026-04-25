/**
 * 精听测验选项生成器
 * 支持考试资源（真题JSON）和非考试资源（API生成）
 */

import { API_CONFIG } from './config.js';

const CACHE_KEY = 'beelisten-quiz-cache';
const EXPLANATION_CACHE_KEY = 'beelisten-explanation-cache';

let examQuestionsCache = {};

function getCache() {
    try {
        const raw = localStorage.getItem(CACHE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

function setCache(cache) {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (e) {
        console.error('[QuizGenerator] 缓存保存失败:', e);
    }
}

function getCachedOptions(resourceId, sentenceIndex) {
    const cache = getCache();
    if (cache[resourceId] && cache[resourceId][sentenceIndex]) {
        console.log('[QuizGenerator] 使用缓存选项');
        return cache[resourceId][sentenceIndex];
    }
    return null;
}

function saveCachedOptions(resourceId, sentenceIndex, options) {
    const cache = getCache();
    if (!cache[resourceId]) {
        cache[resourceId] = {};
    }
    cache[resourceId][sentenceIndex] = {
        options,
        generatedAt: new Date().toISOString()
    };
    setCache(cache);
}

async function callDeepSeekAPI(sentence) {
    const prompt = `你是一个英语听力考试的出题专家。请根据以下英文句子，生成一道"细节理解题"。

【出题要求】
1. 题目类型：细节理解题（不是翻译题！）
2. 正确选项：准确概括句子中的关键信息（时间、地点、人物、原因、结果等）
3. 干扰项设计策略（必须使用以下至少3种）：
   - 时间错误：把"2015年"改成"2010年"，把"昨天"改成"明天"
   - 地点错误：把"纽约"改成"洛杉矶"，把"学校"改成"公司"
   - 人物错误：把"他"改成"她"，把"医生"改成"老师"
   - 因果错误：把原因和结果对调，或编造错误的原因
   - 行为错误：把"买"改成"卖"，把"去"改成"回"
   - 数量错误：把"三个"改成"五个"，把"很多"改成"很少"
   - 态度错误：把"喜欢"改成"讨厌"，把"紧张"改成"兴奋"
4. 四个选项内容要有明显差异，不能只改一两个词
5. 选项长度可以不同，但不要让正确答案明显更长或更短

【示例】
原文："I moved to New York in 2015 to study music at Juilliard."
正确选项：她2015年搬到纽约学习音乐
干扰项A：她在纽约住了10年后才开始学音乐（时间错误）
干扰项B：她去洛杉矶的Juilliard学习艺术（地点+内容错误）
干扰项C：她2015年毕业后来纽约工作（因果+行为错误）

【当前句子】
英文句子: "${sentence}"

请以JSON格式返回：
{
  "options": [
    {"text": "选项内容", "correct": true/false},
    {"text": "选项内容", "correct": true/false},
    {"text": "选项内容", "correct": true/false},
    {"text": "选项内容", "correct": true/false}
  ]
}`;

    const response = await fetch(`${API_CONFIG.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_CONFIG.apiKey}`
        },
        body: JSON.stringify({
            model: API_CONFIG.model,
            messages: [
                { role: 'system', content: '你是一个专业的英语听力考试出题专家，擅长设计高质量的细节理解题。你的干扰项设计巧妙，能有效考察学生是否真正听懂了内容。' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 500,
            response_format: { type: 'json_object' }
        })
    });

    if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
        throw new Error('API返回内容为空');
    }

    const result = JSON.parse(content);
    
    if (!result.options || !Array.isArray(result.options)) {
        throw new Error('API返回格式错误');
    }

    return result.options;
}

export async function generateOptions(sentence, resourceId, sentenceIndex) {
    const cached = getCachedOptions(resourceId, sentenceIndex);
    if (cached) {
        return cached.options;
    }
    
    const options = await callDeepSeekAPI(sentence);
    
    saveCachedOptions(resourceId, sentenceIndex, options);
    
    return options;
}

export async function loadExamQuestions(questionsFile) {
    if (examQuestionsCache[questionsFile]) {
        return examQuestionsCache[questionsFile];
    }
    
    const response = await fetch(`../${questionsFile}`);
    const data = await response.json();
    examQuestionsCache[questionsFile] = data;
    return data;
}

export async function generateExplanation(questionText, correctAnswer, selectedAnswer) {
    const cacheKey = `${questionText}_${correctAnswer}`;
    
    try {
        const rawCache = localStorage.getItem(EXPLANATION_CACHE_KEY);
        const cache = rawCache ? JSON.parse(rawCache) : {};
        
        if (cache[cacheKey]) {
            return cache[cacheKey];
        }
    } catch (e) {}
    
    try {
        const prompt = `请为以下英语听力题生成解析：

题目：${questionText}
正确答案：${correctAnswer}
学生选择的错误答案：${selectedAnswer}

请用中文解释：
1. 正确答案为什么是对的
2. 学生可能为什么选错了
3. 听力技巧提示

请用简洁的语言回答，不超过100字。`;

        const response = await fetch(`${API_CONFIG.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_CONFIG.apiKey}`
            },
            body: JSON.stringify({
                model: API_CONFIG.model,
                messages: [
                    { role: 'system', content: '你是一个英语听力教学专家，善于用简洁的语言解释听力题的解题思路。' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 200
            })
        });

        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        const explanation = data.choices[0]?.message?.content;
        
        if (explanation) {
            try {
                const rawCache = localStorage.getItem(EXPLANATION_CACHE_KEY) || '{}';
                const cache = JSON.parse(rawCache);
                cache[cacheKey] = explanation;
                localStorage.setItem(EXPLANATION_CACHE_KEY, JSON.stringify(cache));
            } catch (e) {}
        }
        
        return explanation;
    } catch (error) {
        console.error('[QuizGenerator] 解析生成失败:', error);
        return null;
    }
}

export function clearCache() {
    localStorage.removeItem(CACHE_KEY);
}

export function clearResourceCache(resourceId) {
    const cache = getCache();
    if (cache[resourceId]) {
        delete cache[resourceId];
        setCache(cache);
    }
}

export function clearExamQuestionsCache() {
    examQuestionsCache = {};
}

const ANALYSIS_CACHE_KEY = 'beelisten-analysis-cache';

export async function generatePassageAnalysis(passageName, correctCount, wrongCount, wrongAnswers) {
    const total = correctCount + wrongCount;
    const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    
    const cacheKey = `${passageName}_${correctCount}_${wrongCount}`;
    
    try {
        const rawCache = localStorage.getItem(ANALYSIS_CACHE_KEY);
        const cache = rawCache ? JSON.parse(rawCache) : {};
        
        if (cache[cacheKey]) {
            console.log('[QuizGenerator] 使用缓存的分析结果');
            return cache[cacheKey];
        }
    } catch (e) {}
    
    const wrongSummary = wrongAnswers.length > 0 
        ? wrongAnswers.map(w => 
            `题目${w.questionNumber}: ${w.question} (选了: ${w.selectedAnswer}, 正确: ${w.correctAnswer})`
        ).join('\n')
        : '无错题';
    
    const prompt = `请分析以下英语听力测验结果，给出简洁的学习建议：

段落：${passageName}
总题数：${total}
正确：${correctCount}
错误：${wrongCount}
正确率：${accuracy}%

错题详情：
${wrongSummary}

请用中文给出：
1. 整体表现评价（一句话）
2. 错题原因分析（如有错题）
3. 改进建议（1-2条）

总字数不超过150字。`;

    try {
        const response = await fetch(`${API_CONFIG.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_CONFIG.apiKey}`
            },
            body: JSON.stringify({
                model: API_CONFIG.model,
                messages: [
                    { role: 'system', content: '你是一个英语听力教学专家，善于用简洁的语言分析学生的听力测验表现并给出实用的学习建议。' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 300
            })
        });

        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        const analysis = data.choices[0]?.message?.content;
        
        if (analysis) {
            try {
                const rawCache = localStorage.getItem(ANALYSIS_CACHE_KEY) || '{}';
                const cache = JSON.parse(rawCache);
                cache[cacheKey] = analysis;
                localStorage.setItem(ANALYSIS_CACHE_KEY, JSON.stringify(cache));
            } catch (e) {}
        }
        
        return analysis;
    } catch (error) {
        console.error('[QuizGenerator] 分析生成失败:', error);
        return null;
    }
}
