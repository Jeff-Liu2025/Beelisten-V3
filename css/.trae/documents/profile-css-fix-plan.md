# 个人档案模块CSS样式问题修复计划

## 问题诊断

### 发现的问题

**核心问题：HTML结构错误 -** **`profilePage`** **被放在了错误的位置**

通过分析 `index.html` 文件，发现：

```
第626行: </div>  <!-- 关闭 testPage -->
第627行: </div>  <!-- 关闭 main-content -->
第628行: </div>  <!-- 关闭 container -->
第638行: <div class="page-content hidden" id="profilePage">  <!-- profilePage 在 container 外面！ -->
```

**问题影响：**

1. `profilePage` 没有在 `main-content` 内部，无法继承布局样式
2. 缺少 `main-content` 的 padding、背景色等基础样式
3. 页面显示为"白板黑字"是因为没有任何容器样式包裹

### 对比其他页面

其他页面（learnPage、reviewPage、testPage）都正确放置在 `main-content` 内部：

```html
<div class="main-content">
    <div class="page-content" id="learnPage">...</div>
    <div class="page-content hidden" id="reviewPage">...</div>
    <div class="page-content hidden" id="testPage">...</div>
    <!-- profilePage 应该在这里！ -->
</div>
```

## 修复方案

### 步骤1：移动 profilePage 到正确位置

将 `profilePage` 的HTML内容（第638-784行）移动到 `main-content` 内部，放在 `testPage` 之后。

**修改前：**

```html
            </div>  <!-- testPage 结束 -->
        </div>      <!-- main-content 结束 -->
    </div>          <!-- container 结束 -->
    
    <!-- profilePage 在这里（错误位置）-->
    <div class="page-content hidden" id="profilePage">
        ...
    </div>
```

**修改后：**

```html
            </div>  <!-- testPage 结束 -->
            
            <!-- profilePage 移动到 main-content 内部 -->
            <div class="page-content hidden" id="profilePage">
                ...
            </div>
        </div>      <!-- main-content 结束 -->
    </div>          <!-- container 结束 -->
```

### 步骤2：验证CSS文件引入

确认 `profile.css` 已正确引入（第44行已确认正确）：

```html
<link rel="stylesheet" href="../css/profile.css">
```

### 步骤3：测试验证

修复后需要验证：

1. 点击侧边栏"个人档案"菜单能正确切换显示
2. 页面样式正确显示（黄色渐变背景、卡片样式等）
3. 热图、时段分布图等动态内容正常渲染

## 技术细节

### 涉及文件

* `c:\Users\123\Desktop\Beelisten-v2\htlm\index.html`

### 修改范围

* 删除：第634-784行（错误位置的 profilePage）

* 插入：在第626行后插入 profilePage 内容

### 风险评估

* 低风险：仅调整HTML结构，不涉及CSS和JS逻辑

* 需要确保移动后缩进格式正确

## 实施步骤

1. 在 `testPage` 结束标签后、`main-content` 结束标签前插入 profilePage
2. 删除原位置的 profilePage 代码
3. 调整缩进格式保持一致
4. 测试页面切换和样式显示

