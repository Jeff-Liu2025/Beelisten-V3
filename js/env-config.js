// 环境配置文件
// 自动检测当前环境并返回正确的资源路径

const ENV = {
    // 检测是否为 GitHub Pages
    isGitHubPages: window.location.hostname.includes('github.io'),
    
    // 获取基础路径
    getBasePath() {
        if (this.isGitHubPages) {
            // GitHub Pages 需要包含项目名
            return '/Beelisten-V3/';
        }
        // 本地开发环境
        return '/';
    },
    
    // 获取音频路径
    getAudioPath(filename) {
        return `${this.getBasePath()}听力资源/${filename}`;
    },
    
    // 获取字幕路径
    getSubtitlePath(filename) {
        return `${this.getBasePath()}听力资源/${filename}`;
    },
    
    // 获取音效路径
    getSoundPath(filename) {
        return `${this.getBasePath()}按键提示音效/${filename}`;
    }
};

// 导出配置
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ENV;
}
