/**
 * 状态管理模块 - Beelisten v2
 * 集中管理应用状态，通过事件通知状态变化
 */

const state = {
    subtitles: [],
    currentSubtitleIndex: -1,
    currentTime: 0,
    duration: 0,
    isPlaying: false,
    volume: 1,
    playbackRate: 1,
    currentPodcast: null,
    subtitleMode: 'original',
    currentPage: 'learn',
    honeyCoins: parseInt(localStorage.getItem('beelisten_honey_coins')) || 0,
    ownedItems: JSON.parse(localStorage.getItem('beelisten_owned_items')) || {},
    activeEffects: JSON.parse(localStorage.getItem('beelisten_active_effects')) || []
};

const listeners = new Map();

export function get(key) {
    return state[key];
}

export function set(key, value) {
    const oldValue = state[key];
    state[key] = value;
    
    if (oldValue !== value) {
        emit(`${key}-changed`, { key, oldValue, newValue: value });
    }
}

export function getState() {
    return { ...state };
}

export function setState(newState) {
    const oldState = { ...state };
    Object.assign(state, newState);
    
    for (const key in newState) {
        if (oldState[key] !== newState[key]) {
            emit(`${key}-changed`, { 
                key, 
                oldValue: oldState[key], 
                newValue: newState[key] 
            });
        }
    }
}

export function subscribe(event, callback) {
    if (!listeners.has(event)) {
        listeners.set(event, new Set());
    }
    listeners.get(event).add(callback);
    
    return function unsubscribe() {
        listeners.get(event).delete(callback);
    };
}

export function emit(event, data) {
    document.dispatchEvent(new CustomEvent(`state-${event}`, { 
        detail: data 
    }));
    
    if (listeners.has(event)) {
        listeners.get(event).forEach(callback => {
            try {
                callback(data);
            } catch (err) {
                console.error(`[Store] 监听器执行错误 (${event}):`, err);
            }
        });
    }
}

export function on(event, callback) {
    const handler = (e) => callback(e.detail);
    document.addEventListener(`state-${event}`, handler);
    
    return function off() {
        document.removeEventListener(`state-${event}`, handler);
    };
}

export function reset() {
    state.subtitles = [];
    state.currentSubtitleIndex = -1;
    state.currentTime = 0;
    state.duration = 0;
    state.isPlaying = false;
    state.currentPodcast = null;
}

export function addHoneyCoins(amount) {
    const current = state.honeyCoins || 0;
    const newAmount = current + amount;
    state.honeyCoins = newAmount;
    localStorage.setItem('beelisten_honey_coins', newAmount);
    emit('honeyCoins-changed', { key: 'honeyCoins', oldValue: current, newValue: newAmount });
    return newAmount;
}

export function spendHoneyCoins(amount) {
    const current = state.honeyCoins || 0;
    if (current < amount) return false;
    const newAmount = current - amount;
    state.honeyCoins = newAmount;
    localStorage.setItem('beelisten_honey_coins', newAmount);
    emit('honeyCoins-changed', { key: 'honeyCoins', oldValue: current, newValue: newAmount });
    return true;
}

export function addOwnedItem(itemId, quantity = 1) {
    const current = state.ownedItems || {};
    current[itemId] = (current[itemId] || 0) + quantity;
    state.ownedItems = current;
    localStorage.setItem('beelisten_owned_items', JSON.stringify(current));
    emit('ownedItems-changed', { key: 'ownedItems', oldValue: state.ownedItems, newValue: current });
}

export function useOwnedItem(itemId) {
    const current = state.ownedItems || {};
    if (!current[itemId] || current[itemId] <= 0) return false;
    current[itemId] -= 1;
    if (current[itemId] <= 0) delete current[itemId];
    state.ownedItems = current;
    localStorage.setItem('beelisten_owned_items', JSON.stringify(current));
    emit('ownedItems-changed', { key: 'ownedItems', oldValue: state.ownedItems, newValue: current });
    return true;
}

export function addActiveEffect(effect) {
    const current = state.activeEffects || [];
    current.push({ ...effect, activatedAt: Date.now() });
    state.activeEffects = current;
    localStorage.setItem('beelisten_active_effects', JSON.stringify(current));
    emit('activeEffects-changed', { key: 'activeEffects', oldValue: state.activeEffects, newValue: current });
}

export function removeActiveEffect(effectId) {
    const current = state.activeEffects || [];
    const filtered = current.filter(e => e.id !== effectId);
    state.activeEffects = filtered;
    localStorage.setItem('beelisten_active_effects', JSON.stringify(filtered));
    emit('activeEffects-changed', { key: 'activeEffects', oldValue: current, newValue: filtered });
}

const Store = {
    get,
    set,
    getState,
    setState,
    subscribe,
    emit,
    on,
    reset,
    addHoneyCoins,
    spendHoneyCoins,
    addOwnedItem,
    useOwnedItem,
    addActiveEffect,
    removeActiveEffect
};

export default Store;
