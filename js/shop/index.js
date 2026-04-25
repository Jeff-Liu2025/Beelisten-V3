/**
 * HoneyCoin Shop 模块 - Beelisten v2
 * 虚拟经济系统：商店、背包、HoneyCoin 管理
 */

const SHOP_ITEMS = [
    {
        id: 'hint-card',
        name: '提示卡',
        icon: '💡',
        description: '在练习中获得一次单词提示',
        price: 50,
        category: 'tool',
        type: 'consumable'
    },
    {
        id: 'time-extension',
        name: '时间延长',
        icon: '⏳',
        description: '延长练习倒计时 30 秒',
        price: 30,
        category: 'tool',
        type: 'consumable'
    },
    {
        id: 'double-points',
        name: '双倍积分',
        icon: '✨',
        description: '下一次练习获得双倍 HoneyCoin',
        price: 100,
        category: 'tool',
        type: 'consumable'
    },
    {
        id: 'golden-frame',
        name: '金色边框',
        icon: '🖼️',
        description: '为头像添加专属金色边框',
        price: 200,
        category: 'decoration',
        type: 'permanent'
    },
    {
        id: 'expert-badge',
        name: '专家徽章',
        icon: '🏅',
        description: '展示你的听力专家身份',
        price: 500,
        category: 'decoration',
        type: 'permanent'
    },
    {
        id: 'dark-theme',
        name: '暗黑主题',
        icon: '🌙',
        description: '解锁专属暗黑模式外观',
        price: 300,
        category: 'decoration',
        type: 'permanent'
    }
];

const STORAGE_KEYS = {
    coins: 'beelisten_honey_coins',
    ownedItems: 'beelisten_owned_items',
    activeEffects: 'beelisten_active_effects'
};

function getHoneyCoins() {
    const raw = localStorage.getItem(STORAGE_KEYS.coins);
    const coins = raw === null ? 0 : parseInt(raw, 10);
    return isNaN(coins) ? 0 : coins;
}

function addHoneyCoins(amount) {
    if (typeof amount !== 'number' || amount <= 0) {
        return false;
    }
    const current = getHoneyCoins();
    const next = current + Math.floor(amount);
    localStorage.setItem(STORAGE_KEYS.coins, String(next));
    document.dispatchEvent(new CustomEvent('honeyCoins-changed', { detail: { oldValue: current, newValue: next } }));
    return true;
}

function spendHoneyCoins(amount) {
    if (typeof amount !== 'number' || amount <= 0) {
        return false;
    }
    const current = getHoneyCoins();
    const cost = Math.floor(amount);
    if (current < cost) {
        return false;
    }
    localStorage.setItem(STORAGE_KEYS.coins, String(current - cost));
    return true;
}

function getOwnedItems() {
    const raw = localStorage.getItem(STORAGE_KEYS.ownedItems);
    if (!raw) {
        return {};
    }
    try {
        const parsed = JSON.parse(raw);
        return typeof parsed === 'object' && parsed !== null ? parsed : {};
    } catch {
        return {};
    }
}

function setOwnedItems(items) {
    localStorage.setItem(STORAGE_KEYS.ownedItems, JSON.stringify(items));
}

function getActiveEffects() {
    const raw = localStorage.getItem(STORAGE_KEYS.activeEffects);
    if (!raw) {
        return {};
    }
    try {
        const parsed = JSON.parse(raw);
        return typeof parsed === 'object' && parsed !== null ? parsed : {};
    } catch {
        return {};
    }
}

function setActiveEffects(effects) {
    localStorage.setItem(STORAGE_KEYS.activeEffects, JSON.stringify(effects));
}

function buyItem(itemId) {
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item) {
        return { success: false, message: '商品不存在' };
    }

    const owned = getOwnedItems();

    if (item.type === 'permanent') {
        if (owned[itemId]) {
            return { success: false, message: '你已拥有该装饰品' };
        }
    }

    if (!spendHoneyCoins(item.price)) {
        return { success: false, message: '蜂蜜币不足！去学习赚取更多吧~' };
    }

    if (item.type === 'consumable') {
        owned[itemId] = (owned[itemId] || 0) + 1;
    } else {
        owned[itemId] = 1;
    }

    setOwnedItems(owned);

    return {
        success: true,
        message: `成功购买 ${item.icon} ${item.name}`
    };
}

function getInventory() {
    const owned = getOwnedItems();
    const inventory = [];

    for (const itemId in owned) {
        const item = SHOP_ITEMS.find(i => i.id === itemId);
        if (!item) {
            continue;
        }
        inventory.push({
            ...item,
            quantity: owned[itemId]
        });
    }

    return inventory;
}

function hasItem(itemId) {
    const owned = getOwnedItems();
    const qty = owned[itemId];
    return typeof qty === 'number' && qty > 0;
}

function useItem(itemId) {
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item) {
        return { success: false, message: '物品不存在' };
    }

    if (item.type !== 'consumable') {
        return { success: false, message: '该物品无法使用' };
    }

    const owned = getOwnedItems();
    const qty = owned[itemId] || 0;

    if (qty <= 0) {
        return { success: false, message: '背包中没有该物品' };
    }

    owned[itemId] = qty - 1;
    if (owned[itemId] <= 0) {
        delete owned[itemId];
    }
    setOwnedItems(owned);

    const effects = getActiveEffects();
    effects[itemId] = (effects[itemId] || 0) + 1;
    setActiveEffects(effects);

    return {
        success: true,
        message: `使用了 ${item.icon} ${item.name}`
    };
}

function createToast(message, type = 'info') {
    let container = document.getElementById('shop-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'shop-toast-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            gap: 8px;
        `;
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    const bg = type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : '#3b82f6';
    toast.style.cssText = `
        background: ${bg};
        color: #fff;
        padding: 12px 16px;
        border-radius: 8px;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transform: translateX(120%);
        transition: transform 0.3s ease;
        max-width: 280px;
        word-break: break-word;
    `;
    toast.textContent = message;

    container.appendChild(toast);

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            toast.style.transform = 'translateX(0)';
        });
    });

    setTimeout(() => {
        toast.style.transform = 'translateX(120%)';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 2500);
}

class Shop {
    constructor() {
        this.container = null;
        this.currentCategory = 'all';
    }

    init() {
        console.log('[Shop] HoneyCoin Shop 初始化完成');
    }

    render(container) {
        if (typeof container === 'string') {
            this.container = document.getElementById(container);
        } else if (container instanceof HTMLElement) {
            this.container = container;
        }

        if (!this.container) {
            console.warn('[Shop] 未找到渲染容器');
            return;
        }

        this.updateCoinDisplay();
        this.updateInventoryBadge();
        this.renderShopGrid();
        this.bindEvents();
    }

    renderShopGrid(category = 'all') {
        const grid = document.getElementById('shopGrid');
        if (!grid) return;

        let items = SHOP_ITEMS;
        if (category !== 'all') {
            items = SHOP_ITEMS.filter(item => item.category === category);
        }

        const owned = getOwnedItems();
        const coins = getHoneyCoins();

        grid.innerHTML = items.map(item => {
            const ownedQty = owned[item.id] || 0;
            const isOwned = ownedQty > 0;
            const isPermanent = item.type === 'permanent';
            const canAfford = coins >= item.price;
            
            let btnClass = 'shop-buy-btn';
            let btnText = `${item.price} 🍯`;
            let btnDisabled = '';
            
            if (isPermanent && isOwned) {
                btnClass += ' owned';
                btnText = '已拥有';
                btnDisabled = 'disabled';
            } else if (!canAfford) {
                btnClass += ' disabled';
                btnDisabled = 'disabled';
            }
            
            const qtyBadge = !isPermanent && ownedQty > 0 
                ? `<span class="shop-item-qty">x${ownedQty}</span>` 
                : '';

            return `
                <div class="shop-item-card ${isPermanent && isOwned ? 'owned' : ''}" data-item-id="${item.id}">
                    <div class="shop-item-icon">${item.icon}</div>
                    <div class="shop-item-name">${item.name} ${qtyBadge}</div>
                    <div class="shop-item-desc">${item.description}</div>
                    <div class="shop-item-price">
                        <span class="price-icon">🍯</span>
                        <span>${item.price}</span>
                    </div>
                    <button class="${btnClass}" ${btnDisabled} data-item-id="${item.id}">
                        ${btnText}
                    </button>
                </div>
            `;
        }).join('');

        this.bindBuyButtons();
    }

    bindEvents() {
        this.bindBuyButtons();
        this.bindInventoryButton();
        this.bindTabButtons();
        this.bindInventoryPanelEvents();
    }

    bindBuyButtons() {
        const buttons = document.querySelectorAll('.shop-buy-btn');
        buttons.forEach(btn => {
            btn.onclick = (e) => {
                const itemId = e.currentTarget.dataset.itemId;
                if (itemId) {
                    this.buy(itemId);
                }
            };
        });
    }

    bindInventoryButton() {
        const btn = document.getElementById('shopInventoryBtn');
        if (btn) {
            btn.onclick = () => this.showInventory();
        }
    }

    bindTabButtons() {
        const tabs = document.querySelectorAll('.shop-tab');
        tabs.forEach(tab => {
            tab.onclick = (e) => {
                tabs.forEach(t => t.classList.remove('active'));
                e.currentTarget.classList.add('active');
                const category = e.currentTarget.dataset.category;
                this.currentCategory = category;
                this.renderShopGrid(category);
            };
        });
    }

    bindInventoryPanelEvents() {
        const closeBtn = document.getElementById('inventoryClose');
        const overlay = document.getElementById('shopOverlay');
        
        if (closeBtn) {
            closeBtn.onclick = () => this.hideInventory();
        }
        
        if (overlay) {
            overlay.onclick = () => this.hideInventory();
        }
    }

    updateCoinDisplay() {
        const coinEl = document.getElementById('coinAmount');
        if (coinEl) {
            coinEl.textContent = getHoneyCoins();
        }
    }

    updateInventoryBadge() {
        const badge = document.getElementById('inventoryBadge');
        if (badge) {
            const inventory = getInventory();
            const totalItems = inventory.reduce((sum, item) => sum + item.quantity, 0);
            badge.textContent = totalItems;
            badge.style.display = totalItems > 0 ? 'inline' : 'none';
        }
    }

    showInventory() {
        const panel = document.getElementById('shopInventoryPanel');
        const overlay = document.getElementById('shopOverlay');
        const list = document.getElementById('inventoryList');
        
        if (!panel || !list) {
            console.warn('[Shop] 背包面板元素不存在');
            return;
        }

        const inventory = getInventory();
        const consumables = inventory.filter(i => i.type === 'consumable');
        const permanents = inventory.filter(i => i.type === 'permanent');

        if (inventory.length === 0) {
            list.innerHTML = `
                <div class="shop-inventory-empty">
                    <div class="shop-inventory-empty-icon">🎒</div>
                    <div class="shop-inventory-empty-text">背包空空如也<br>去商店买点东西吧~</div>
                </div>
            `;
        } else {
            const renderItem = (item) => `
                <div class="shop-inventory-item">
                    <div class="shop-inventory-item-icon">${item.icon}</div>
                    <div class="shop-inventory-item-info">
                        <div class="shop-inventory-item-name">${item.name}</div>
                        <div class="shop-inventory-item-meta">${item.description}</div>
                    </div>
                    ${item.type === 'consumable' ? `
                        <div class="shop-inventory-item-qty">x${item.quantity}</div>
                        <button class="shop-inventory-item-use-btn" data-item-id="${item.id}">使用</button>
                    ` : '<div class="shop-inventory-item-tag">永久</div>'}
                </div>
            `;

            let html = '';
            if (consumables.length > 0) {
                html += `<div class="inventory-section"><div class="inventory-section-title">🎒 道具</div>${consumables.map(renderItem).join('')}</div>`;
            }
            if (permanents.length > 0) {
                html += `<div class="inventory-section"><div class="inventory-section-title">🎨 装饰</div>${permanents.map(renderItem).join('')}</div>`;
            }
            list.innerHTML = html;

            const useButtons = list.querySelectorAll('.shop-inventory-item-use-btn');
            useButtons.forEach(btn => {
                btn.onclick = (e) => {
                    const itemId = e.currentTarget.dataset.itemId;
                    if (itemId) {
                        this.use(itemId);
                        this.showInventory();
                        this.updateInventoryBadge();
                    }
                };
            });
        }

        panel.classList.remove('hidden');
        panel.classList.add('open');
        if (overlay) {
            overlay.classList.remove('hidden');
            overlay.classList.add('open');
        }
    }

    hideInventory() {
        const panel = document.getElementById('shopInventoryPanel');
        const overlay = document.getElementById('shopOverlay');
        
        if (panel) {
            panel.classList.remove('open');
            panel.classList.add('hidden');
        }
        if (overlay) {
            overlay.classList.remove('open');
            overlay.classList.add('hidden');
        }
    }

    buy(itemId) {
        const result = buyItem(itemId);
        createToast(result.message, result.success ? 'success' : 'error');

        if (result.success) {
            this.updateCoinDisplay();
            this.updateInventoryBadge();
            this.renderShopGrid(this.currentCategory);
        }

        return result;
    }

    use(itemId) {
        const result = useItem(itemId);
        createToast(result.message, result.success ? 'success' : 'error');
        return result;
    }

    getCoins() {
        return getHoneyCoins();
    }
}

export {
    Shop,
    SHOP_ITEMS,
    getHoneyCoins,
    addHoneyCoins,
    spendHoneyCoins,
    buyItem,
    getInventory,
    hasItem,
    useItem,
    createToast
};

export default Shop;
