/**
 * 道具管理器
 * 负责道具的使用、状态管理等
 */

export class ItemManager {
    constructor() {
        this.activeDoublePoints = false;
        this.usedHintCard = false;
    }
    
    /**
     * 获取拥有的道具
     * @returns {Object} 道具对象
     */
    getOwnedItems() {
        try {
            const items = localStorage.getItem('beelisten_owned_items');
            return items ? JSON.parse(items) : {};
        } catch (e) {
            console.error('[ItemManager] 获取道具失败:', e);
            return {};
        }
    }
    
    /**
     * 使用提示卡
     * @returns {boolean} 是否成功使用
     */
    useHintCard() {
        if (this.usedHintCard) {
            console.log('[ItemManager] 已使用提示卡');
            return false;
        }
        
        const ownedItems = this.getOwnedItems();
        if ((ownedItems['hint-card'] || 0) <= 0) {
            console.log('[ItemManager] 没有提示卡');
            return false;
        }
        
        ownedItems['hint-card'] -= 1;
        if (ownedItems['hint-card'] <= 0) delete ownedItems['hint-card'];
        localStorage.setItem('beelisten_owned_items', JSON.stringify(ownedItems));
        
        this.usedHintCard = true;
        console.log('[ItemManager] 使用提示卡');
        return true;
    }
    
    /**
     * 使用双倍积分
     * @returns {boolean} 是否成功使用
     */
    useDoublePoints() {
        if (this.activeDoublePoints) {
            console.log('[ItemManager] 双倍积分已激活');
            return false;
        }
        
        const ownedItems = this.getOwnedItems();
        if ((ownedItems['double-points'] || 0) <= 0) {
            console.log('[ItemManager] 没有双倍积分卡');
            return false;
        }
        
        ownedItems['double-points'] -= 1;
        if (ownedItems['double-points'] <= 0) delete ownedItems['double-points'];
        localStorage.setItem('beelisten_owned_items', JSON.stringify(ownedItems));
        
        this.activeDoublePoints = true;
        console.log('[ItemManager] 激活双倍积分');
        return true;
    }
    
    /**
     * 获取奖励倍数
     * @returns {number} 奖励倍数
     */
    getRewardMultiplier() {
        return this.activeDoublePoints ? 2 : 1;
    }
    
    /**
     * 为新句子重置状态
     */
    resetForNewSentence() {
        this.usedHintCard = false;
    }
    
    /**
     * 为新分段重置状态
     */
    resetForNewSegment() {
        this.usedHintCard = false;
        this.activeDoublePoints = false;
    }
}

export default ItemManager;
