# Tasks

- [x] Task 1: 创建小店模块核心逻辑 `js/shop/index.js`
  - [x] SubTask 1.1: 定义商品数据（道具和装饰两类）
  - [x] SubTask 1.2: 实现蜂蜜币读写（localStorage 持久化）
  - [x] SubTask 1.3: 实现购买逻辑（余额检查、扣除、重复购买限制）
  - [x] SubTask 1.4: 实现背包管理（已购商品存储、道具使用）
  - [x] SubTask 1.5: 实现购买成功/失败提示

- [x] Task 2: 创建小店页面样式 `css/shop.css`
  - [x] SubTask 2.1: 蜂蜜币余额显示样式（顶部固定栏）
  - [x] SubTask 2.2: 商品卡片网格布局
  - [x] SubTask 2.3: 商品分类标签样式
  - [x] SubTask 2.4: 购买按钮状态样式（可购买/余额不足/已拥有）
  - [x] SubTask 2.5: 背包弹窗/面板样式
  - [x] SubTask 2.6: 购买提示动画

- [x] Task 3: 修改 `index.html` 替换小店占位符
  - [x] SubTask 3.1: 添加蜂蜜币余额显示区域
  - [x] SubTask 3.2: 添加商品分类标签（道具/装饰）
  - [x] SubTask 3.3: 添加商品列表容器
  - [x] SubTask 3.4: 添加背包入口按钮
  - [x] SubTask 3.5: 添加背包面板（默认隐藏）
  - [x] SubTask 3.6: 引入 `css/shop.css` 和 `js/shop/index.js`

- [x] Task 4: 修改 Store 状态管理 `js/store/index.js`
  - [x] SubTask 4.1: 添加 `honeyCoins` 状态及 getter/setter
  - [x] SubTask 4.2: 添加 `ownedItems` 状态及 getter/setter
  - [x] SubTask 4.3: 添加 `activeEffects` 状态及 getter/setter

- [x] Task 5: 修改主入口 `js/main.js`
  - [x] SubTask 5.1: 导入 Shop 模块
  - [x] SubTask 5.2: 在 `initModules` 中初始化 Shop
  - [x] SubTask 5.3: 在 `navigateTo` 中处理 shop 页面渲染

- [x] Task 6: 集成蜂蜜币奖励到学习流程
  - [x] SubTask 6.1: 词块填空完成后奖励蜂蜜币
  - [ ] SubTask 6.2: 听力训练完成后奖励蜂蜜币（待后续实现）
  - [ ] SubTask 6.3: 连续登录检测及奖励（待后续实现）

# Task Dependencies
- Task 2 依赖 Task 1（需要知道 DOM 结构）
- Task 3 依赖 Task 1 和 Task 2
- Task 5 依赖 Task 1 和 Task 4
- Task 6 依赖 Task 4
