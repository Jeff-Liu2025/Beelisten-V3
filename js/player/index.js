/**
 * 播放器模块 - Beelisten v2
 * 深度适配HTML/CSS结构，支持播客详情页和测试页两个播放器
 */

import { formatTime } from '../utils/time.js';
import Store from '../store/index.js';

class Player {
    constructor(options = {}) {
        this.options = {
            audioId: 'podcastAudio',
            playBtnId: 'podcastPlayPauseBtn',
            rewindBtnId: 'podcastRewindBtn',
            forwardBtnId: 'podcastForwardBtn',
            progressBarId: 'podcastProgressBar',
            progressFilledId: 'podcastProgressFilled',
            currentTimeId: 'podcastCurrentTime',
            durationId: 'podcastDuration',
            volumeBtnId: 'volumeBtn',
            volumeSliderId: 'volumeSlider',
            speedSelectorClass: 'speed-dropdown',
            speedOptionClass: 'speed-option',
            currentSpeedClass: 'current-speed',
            ...options
        };
        
        this.audio = null;
        this.isPlaying = false;
        this.currentSpeed = 1;
        
        this.init();
    }
    
    init() {
        this.audio = document.getElementById(this.options.audioId);
        
        if (!this.audio) {
            console.warn('[Player] 未找到音频元素:', this.options.audioId);
            return;
        }
        
        this.bindEvents();
        this.bindSpeedSelector();
        console.log('[Player] 初始化完成');
    }
    
    bindEvents() {
        const playBtn = document.getElementById(this.options.playBtnId);
        const rewindBtn = document.getElementById(this.options.rewindBtnId);
        const forwardBtn = document.getElementById(this.options.forwardBtnId);
        const progressBar = document.getElementById(this.options.progressBarId);
        const volumeBtn = document.getElementById(this.options.volumeBtnId);
        const volumeSlider = document.getElementById(this.options.volumeSliderId);
        
        if (playBtn) {
            playBtn.addEventListener('click', () => this.togglePlay());
        }
        
        if (rewindBtn) {
            rewindBtn.addEventListener('click', () => this.seekRelative(-5));
        }
        
        if (forwardBtn) {
            forwardBtn.addEventListener('click', () => this.seekRelative(5));
        }
        
        if (progressBar) {
            progressBar.addEventListener('click', (e) => this.handleProgressClick(e));
        }
        
        if (volumeBtn) {
            volumeBtn.addEventListener('click', () => this.toggleMute());
        }
        
        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => {
                this.setVolume(parseFloat(e.target.value));
            });
        }
        
        this.audio.addEventListener('timeupdate', () => this.onTimeUpdate());
        this.audio.addEventListener('loadedmetadata', () => this.onLoadedMetadata());
        this.audio.addEventListener('ended', () => this.onEnded());
        this.audio.addEventListener('play', () => this.onPlay());
        this.audio.addEventListener('pause', () => this.onPause());
        
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        
        document.addEventListener('subtitle-click', (e) => {
            this.seekTo(e.detail.startTime);
        });
    }
    
    bindSpeedSelector() {
        const speedDropdowns = document.querySelectorAll(`.${this.options.speedSelectorClass}`);
        
        speedDropdowns.forEach(dropdown => {
            const btn = dropdown.querySelector('.speed-dropdown-btn');
            const options = dropdown.querySelectorAll(`.${this.options.speedOptionClass}`);
            
            if (btn) {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    dropdown.classList.toggle('open');
                });
            }
            
            options.forEach(option => {
                option.addEventListener('click', () => {
                    const speed = parseFloat(option.dataset.speed);
                    this.setSpeed(speed);
                    
                    options.forEach(opt => opt.classList.remove('active'));
                    option.classList.add('active');
                    
                    const currentSpeedEl = dropdown.querySelector(`.${this.options.currentSpeedClass}`);
                    if (currentSpeedEl) {
                        currentSpeedEl.textContent = `${speed}x`;
                    }
                    
                    dropdown.classList.remove('open');
                });
            });
        });
        
        document.addEventListener('click', () => {
            speedDropdowns.forEach(dropdown => {
                dropdown.classList.remove('open');
            });
        });
    }
    
    togglePlay() {
        if (!this.audio) return;
        
        if (this.audio.paused) {
            this.audio.play().catch(err => {
                console.error('[Player] 播放失败:', err);
            });
        } else {
            this.audio.pause();
        }
    }
    
    onPlay() {
        this.isPlaying = true;
        this.updatePlayButton();
        Store.set('isPlaying', true);
    }
    
    onPause() {
        this.isPlaying = false;
        this.updatePlayButton();
        Store.set('isPlaying', false);
    }
    
    onEnded() {
        this.isPlaying = false;
        this.updatePlayButton();
        Store.set('isPlaying', false);
    }
    
    updatePlayButton() {
        const playBtn = document.getElementById(this.options.playBtnId);
        if (playBtn) {
            playBtn.textContent = this.isPlaying ? '⏸' : '▶';
        }
    }
    
    onTimeUpdate() {
        const currentTime = this.audio.currentTime;
        const duration = this.audio.duration || 0;
        
        Store.set('currentTime', currentTime);
        
        const currentTimeEl = document.getElementById(this.options.currentTimeId);
        if (currentTimeEl) {
            currentTimeEl.textContent = formatTime(currentTime);
        }
        
        if (duration > 0) {
            const percent = (currentTime / duration) * 100;
            const progressFilled = document.getElementById(this.options.progressFilledId);
            if (progressFilled) {
                progressFilled.style.width = `${percent}%`;
            }
        }
        
        document.dispatchEvent(new CustomEvent('player-timeupdate', {
            detail: { currentTime, duration }
        }));
    }
    
    onLoadedMetadata() {
        const duration = this.audio.duration;
        Store.set('duration', duration);
        
        const durationEl = document.getElementById(this.options.durationId);
        if (durationEl) {
            durationEl.textContent = formatTime(duration);
        }
    }
    
    handleProgressClick(e) {
        if (!this.audio || !this.audio.duration) return;
        
        const progressBar = document.getElementById(this.options.progressBarId);
        if (!progressBar) return;
        
        const rect = progressBar.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        const time = percent * this.audio.duration;
        
        this.seekTo(time);
    }
    
    seekTo(time) {
        if (!this.audio) {
            console.error('[Player] seekTo 失败: audio 元素不存在');
            return;
        }
        
        // 确保音频已加载
        if (this.audio.readyState < 1) {
            console.warn('[Player] 音频未加载，等待加载...');
            this.audio.addEventListener('loadedmetadata', () => {
                this.audio.currentTime = Math.max(0, Math.min(time, this.audio.duration || 0));
            }, { once: true });
            return;
        }
        
        // 设置当前时间
        this.audio.currentTime = Math.max(0, Math.min(time, this.audio.duration || 0));
    }
    
    seekRelative(seconds) {
        if (!this.audio) return;
        
        this.seekTo(this.audio.currentTime + seconds);
    }
    
    setVolume(volume) {
        if (!this.audio) return;
        
        this.audio.volume = Math.max(0, Math.min(1, volume));
        Store.set('volume', this.audio.volume);
        
        this.updateVolumeIcon();
    }
    
    toggleMute() {
        if (!this.audio) return;
        
        if (this.audio.volume > 0) {
            this.previousVolume = this.audio.volume;
            this.setVolume(0);
        } else {
            this.setVolume(this.previousVolume || 1);
        }
        
        const volumeSlider = document.getElementById(this.options.volumeSliderId);
        if (volumeSlider) {
            volumeSlider.value = this.audio.volume;
        }
    }
    
    updateVolumeIcon() {
        const volumeBtn = document.getElementById(this.options.volumeBtnId);
        if (!volumeBtn) return;
        
        const volume = this.audio.volume;
        let icon = '🔊';
        
        if (volume === 0) {
            icon = '🔇';
        } else if (volume < 0.5) {
            icon = '🔉';
        }
        
        volumeBtn.textContent = icon;
    }
    
    setSpeed(speed) {
        if (!this.audio) return;
        
        this.audio.playbackRate = speed;
        this.currentSpeed = speed;
        Store.set('playbackRate', speed);
    }
    
    handleKeyboard(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }
        
        switch (e.code) {
            case 'Space':
                e.preventDefault();
                this.togglePlay();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                this.seekRelative(-5);
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.seekRelative(5);
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.setVolume(this.audio.volume + 0.1);
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.setVolume(this.audio.volume - 0.1);
                break;
        }
    }
    
    load(src) {
        if (!this.audio) return;
        
        this.audio.src = src;
        this.audio.load();
    }
    
    play() {
        if (!this.audio) return;
        
        this.audio.play().catch(err => {
            console.error('[Player] 播放失败:', err);
        });
    }
    
    pause() {
        if (!this.audio) return;
        
        this.audio.pause();
    }
}

export function createPlayer(options) {
    return new Player(options);
}

export default Player;
