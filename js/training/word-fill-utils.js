/**
 * 词块填空训练工具函数
 * 提供停用词列表、单词清理和验证等公共工具函数
 */

/**
 * 停用词列表
 * 这些单词在填空训练中通常不会被选为填空词
 */
export const STOP_WORDS = [
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'must', 'shall', 'can', 'to', 'of', 'in',
    'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through',
    'during', 'before', 'after', 'above', 'below', 'between', 'under',
    'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where',
    'why', 'how', 'all', 'each', 'few', 'more', 'most', 'other', 'some',
    'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than',
    'too', 'very', 'just', 'i', 'me', 'my', 'myself', 'we', 'our', 'ours',
    'you', 'your', 'yours', 'he', 'him', 'his', 'she', 'her', 'hers',
    'it', 'its', 'they', 'them', 'their', 'this', 'that', 'these', 'those'
];

/**
 * 清理单词，移除标点符号并转为小写
 * @param {string} word - 原始单词
 * @returns {string} 清理后的单词
 */
export function cleanWord(word) {
    return word.toLowerCase().replace(/[^a-z]/g, '');
}

/**
 * 检查单词是否为有效单词
 * @param {string} word - 要检查的单词
 * @param {number} minLength - 最小长度要求，默认为3
 * @returns {boolean} 是否为有效单词
 */
export function isValidWord(word, minLength = 3) {
    const cleaned = cleanWord(word);
    return cleaned.length >= minLength && !STOP_WORDS.includes(cleaned);
}

/**
 * 从句子中提取所有有效单词
 * @param {string} sentence - 原始句子
 * @param {number} minLength - 最小长度要求，默认为3
 * @returns {string[]} 有效单词数组
 */
export function extractValidWords(sentence, minLength = 3) {
    return sentence.split(/\s+/).filter(word => isValidWord(word, minLength));
}

/**
 * 转义正则表达式特殊字符
 * @param {string} string - 原始字符串
 * @returns {string} 转义后的字符串
 */
export function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default {
    STOP_WORDS,
    cleanWord,
    isValidWord,
    extractValidWords,
    escapeRegex
};
