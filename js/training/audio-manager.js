/**
 * 音频管理器
 * 负责音频播放、暂停、跳转等操作
 */

export class AudioManager {
    constructor(audioElement) {
        this.audio = audioElement;
        this.isPlaying = false;
        this.sentenceEndTime = null;
        this.sentencePaused = false;
        this.previousVolume = 1;
    }
    
    /**
     * 播放当前句子
     * @param {number} startTime - 开始时间（秒）
     * @param {number} endTime - 结束时间（秒）
     */
    playCurrentSentence(startTime, endTime) {
        this.sentenceEndTime = endTime;
        this.sentencePaused = false;
        
        const playWhenReady = () => {
            this.audio.currentTime = startTime;
            
            const playPromise = this.audio.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    this.isPlaying = true;
                    this.onPlayStateChange();
                }).catch(err => {
                    console.error('[AudioManager] 播放失败:', err);
                });
            } else {
                this.isPlaying = true;
                this.onPlayStateChange();
            }
        };
        
        if (this.audio.readyState >= 2) {
            playWhenReady();
        } else {
            const onCanPlay = () => {
                this.audio.removeEventListener('canplay', onCanPlay);
                playWhenReady();
            };
            this.audio.addEventListener('canplay', onCanPlay);
        }
    }
    
    /**
     * 暂停播放
     */
    pause() {
        this.audio.pause();
        this.isPlaying = false;
        this.onPlayStateChange();
    }
    
    /**
     * 切换播放/暂停
     */
    togglePlay() {
        if (this.isPlaying) {
            this.pause();
        } else {
            if (this.sentencePaused) {
                this.audio.play();
                this.isPlaying = true;
                this.onPlayStateChange();
            } else {
                this.audio.play();
                this.isPlaying = true;
                this.onPlayStateChange();
            }
        }
    }
    
    /**
     * 重播当前句子
     * @param {number} startTime - 开始时间（秒）
     * @param {number} endTime - 结束时间（秒）
     */
    replayCurrent(startTime, endTime) {
        this.sentencePaused = false;
        this.playCurrentSentence(startTime, endTime);
    }
    
    /**
     * 监听时间更新
     * @param {Function} callback - 回调函数
     */
    onTimeUpdate(callback) {
        this.audio.addEventListener('timeupdate', () => {
            if (this.sentenceEndTime && !this.sentencePaused) {
                const currentTime = this.audio.currentTime;
                if (currentTime >= this.sentenceEndTime - 0.1) {
                    this.pause();
                    this.sentencePaused = true;
                }
            }
            if (callback) callback(this.audio.currentTime);
        });
    }
    
    /**
     * 播放状态改变时触发
     */
    onPlayStateChange() {
        const event = new CustomEvent('audioPlayStateChanged', {
            detail: { isPlaying: this.isPlaying }
        });
        document.dispatchEvent(event);
    }
    
    /**
     * 获取当前播放时间
     * @returns {number} 当前时间（秒）
     */
    getCurrentTime() {
        return this.audio.currentTime;
    }
    
    /**
     * 获取音频总时长
     * @returns {number} 总时长（秒）
     */
    getDuration() {
        return this.audio.duration || 0;
    }
    
    /**
     * 设置音量
     * @param {number} volume - 音量值（0-1）
     */
    setVolume(volume) {
        this.audio.volume = volume;
    }
    
    /**
     * 获取音量
     * @returns {number} 音量值（0-1）
     */
    getVolume() {
        return this.audio.volume;
    }
    
    /**
     * 切换静音
     */
    toggleMute() {
        if (this.audio.volume > 0) {
            this.previousVolume = this.audio.volume;
            this.audio.volume = 0;
        } else {
            this.audio.volume = this.previousVolume || 1;
        }
    }
}

export default AudioManager;
