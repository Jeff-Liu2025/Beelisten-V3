# BeeListen 小店模块开发规格

## Why
当前 BeeListen 的"小店"页面仅显示"功能开发中"占位符。为了激励用户持续学习英语，需要引入虚拟经济系统：用户通过学习行为赚取积分（蜂蜜币），在小店中购买虚拟道具和奖励，形成"学习-奖励-再学习"的正向循环。

## What Changes
- 新增 `js/shop/` 目录，包含小店模块核心逻辑
- 新增 `css/shop.css` 样式文件
- 修改 `index.html` 中的 `#shopPage` 占位符为完整小店页面
- 修改 `js/store/index.js` 添加用户资产状态（蜂蜜币、已购道具）
- 修改 `js/main.js` 初始化小店模块并绑定导航

## Impact
- Affected specs: 用户激励系统、虚拟经济系统
- Affected code: `index.html`, `js/main.js`, `js/store/index.js`, 新增 `js/shop/index.js`, `css/shop.css`

## ADDED Requirements

### Requirement: 蜂蜜币系统
The system SHALL 提供一种虚拟货币"蜂蜜币"（HoneyCoin），作为学习行为的奖励。

#### Scenario: 赚取蜂蜜币
- **WHEN** 用户完成一次听力训练
- **THEN** 系统奖励 10 蜂蜜币
- **WHEN** 用户完成词块填空练习并全部正确
- **THEN** 系统奖励 20 蜂蜜币
- **WHEN** 用户连续学习 7 天
- **THEN** 系统额外奖励 50 蜂蜜币（连续登录奖励）

#### Scenario: 蜂蜜币持久化
- **GIVEN** 用户拥有蜂蜜币
- **THEN** 蜂蜜币数量使用 localStorage 持久化存储
- **WHEN** 页面重新加载
- **THEN** 蜂蜜币数量从 localStorage 恢复

### Requirement: 商品系统
The system SHALL 在小店中展示可购买的虚拟商品。

#### Scenario: 商品展示
- **GIVEN** 用户进入小店页面
- **THEN** 系统展示商品列表，每个商品包含：名称、图标、描述、价格、是否已购买
- **AND** 商品分为"道具"和"装饰"两类

#### Scenario: 商品分类
- **道具类**：
  - 提示卡（50币）：词块填空时显示一个正确答案
  - 时间延长卡（30币）：延长答题时间 30 秒
  - 双倍积分卡（100币）：下次训练获得双倍蜂蜜币
- **装饰类**：
  - 黄金蜜蜂头像框（200币）：个人档案显示黄金边框
  - 学习达人徽章（500币）：永久称号，显示在用户名旁
  - 暗夜主题（300币）：切换应用为深色主题

### Requirement: 购买系统
The system SHALL 允许用户使用蜂蜜币购买商品。

#### Scenario: 成功购买
- **GIVEN** 用户蜂蜜币余额充足
- **WHEN** 用户点击商品购买按钮
- **THEN** 扣除对应蜂蜜币
- **AND** 商品标记为已购买
- **AND** 已购商品存入用户背包
- **AND** 显示购买成功提示

#### Scenario: 余额不足
- **GIVEN** 用户蜂蜜币余额不足
- **WHEN** 用户点击商品购买按钮
- **THEN** 显示余额不足提示
- **AND** 引导用户去学习赚取蜂蜜币

#### Scenario: 重复购买限制
- **GIVEN** 用户已购买某装饰类商品
- **WHEN** 用户再次点击购买
- **THEN** 显示"已拥有"提示，禁止重复购买
- **AND** 道具类商品允许重复购买（消耗品）

### Requirement: 背包系统
The system SHALL 提供背包功能，展示用户已拥有的道具。

#### Scenario: 查看背包
- **GIVEN** 用户进入小店页面
- **THEN** 页面顶部显示"我的背包"入口
- **WHEN** 用户点击背包入口
- **THEN** 显示已购道具列表，包含数量和使用按钮

#### Scenario: 使用道具
- **GIVEN** 用户拥有可使用的道具
- **WHEN** 用户在背包中点击"使用"按钮
- **THEN** 道具数量减 1
- **AND** 道具效果激活（如双倍积分卡标记为激活状态）

## MODIFIED Requirements

### Requirement: Store 状态管理
修改 `js/store/index.js`，新增以下状态字段：
- `honeyCoins`: number - 蜂蜜币余额
- `ownedItems`: Object - 已购商品 { itemId: quantity }
- `activeEffects`: Array - 当前激活的道具效果

### Requirement: 页面导航
修改 `js/main.js` 的 `navigateTo` 方法，当导航到 `shop` 页面时，初始化并渲染小店模块。

## REMOVED Requirements
无
