/**
 * 词块填空训练引擎
 * 提供填空训练的核心逻辑，可被不同场景复用
 */

import { cleanWord, extractValidWords, escapeRegex } from './word-fill-utils.js';

export class WordFillEngine {
    constructor(options = {}) {
        this.options = {
            minWordLength: 3,
            defaultBlankCount: 2,
            wordLibrary: null,
            ...options
        };
    }
    
    /**
     * 从句子中提取有效单词
     * @param {string} sentence - 原始句子
     * @returns {string[]} 有效单词数组
     */
    extractValidWords(sentence) {
        return extractValidWords(sentence, this.options.minWordLength);
    }
    
    /**
     * 生成填空配置
     * @param {string} sentence - 原始句子
     * @param {number|null} blankCount - 填空数量，为null时使用默认值
     * @returns {Array} 填空配置数组
     */
    generateBlanks(sentence, blankCount = null) {
        const validWords = this.extractValidWords(sentence);
        
        if (validWords.length === 0) {
            return [];
        }
        
        const actualBlankCount = blankCount || this.options.defaultBlankCount;
        const count = Math.min(actualBlankCount, validWords.length);
        const shuffled = [...validWords].sort(() => Math.random() - 0.5);
        const wordsToBlank = shuffled.slice(0, count);
        
        return wordsToBlank.map((word, index) => ({
            id: `blank-${index}`,
            word: word,
            cleanWord: cleanWord(word)
        }));
    }
    
    /**
     * 生成候选词列表
     * @param {Array} blanks - 填空配置数组
     * @param {number} additionalCount - 额外候选词数量
     * @returns {string[]} 候选词数组
     */
    generateCandidates(blanks, additionalCount = 2) {
        const candidates = blanks.map(b => b.cleanWord);
        
        if (this.options.wordLibrary && candidates.length < blanks.length + additionalCount) {
            const needed = blanks.length + additionalCount - candidates.length;
            const randomWords = this.getRandomWords(this.options.wordLibrary, needed, candidates);
            candidates.push(...randomWords);
        }
        
        return candidates.sort(() => Math.random() - 0.5);
    }
    
    /**
     * 检查答案
     * @param {Array} blanks - 填空配置数组
     * @param {Object} answers - 用户答案对象 {blankId: answer}
     * @returns {Object} 检查结果
     */
    checkAnswers(blanks, answers) {
        let correctCount = 0;
        const results = [];
        
        blanks.forEach(blank => {
            const userAnswer = answers[blank.id] || '';
            const isCorrect = userAnswer.toLowerCase() === blank.cleanWord.toLowerCase();
            
            if (isCorrect) {
                correctCount++;
            }
            
            results.push({
                blankId: blank.id,
                correctAnswer: blank.cleanWord,
                userAnswer: userAnswer,
                isCorrect: isCorrect
            });
        });
        
        return {
            correctCount,
            totalCount: blanks.length,
            isAllCorrect: correctCount === blanks.length,
            results
        };
    }
    
    /**
     * 从词库中获取随机单词
     * @param {string[]} wordLibrary - 词库
     * @param {number} count - 需要的数量
     * @param {string[]} exclude - 需要排除的单词
     * @returns {string[]} 随机单词数组
     */
    getRandomWords(wordLibrary, count, exclude = []) {
        const available = wordLibrary.filter(word => 
            !exclude.includes(word.toLowerCase())
        );
        
        if (available.length === 0) {
            return [];
        }
        
        const shuffled = [...available].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count);
    }
    
    /**
     * 渲染带填空的句子HTML
     * @param {string} sentence - 原始句子
     * @param {Array} blanks - 填空配置数组
     * @param {string} blankClass - 填空元素的CSS类名
     * @returns {string} HTML字符串
     */
    renderSentenceWithBlanks(sentence, blanks, blankClass = 'training-blank') {
        let html = sentence;
        
        blanks.forEach(blank => {
            const regex = new RegExp(`\\b${escapeRegex(blank.word)}\\b`, 'i');
            html = html.replace(regex, 
                `<span class="${blankClass}" 
                       data-blank-id="${blank.id}" 
                       data-answer="${blank.cleanWord}">_____</span>`
            );
        });
        
        return html;
    }
}

export default WordFillEngine;
