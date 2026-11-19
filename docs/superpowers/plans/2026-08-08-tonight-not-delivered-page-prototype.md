# 今晚不送达 页面原型文档实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为《今晚不送达》生成一份可直接指导设计与开发的页面原型文档，并将相关设计文档保存到项目 docs 目录。

**Architecture:** 本次交付不实现产品代码，而是先沉淀完整文档资产。文档拆为两个层次：设计方案负责定义产品目标、流程与边界；页面原型文档负责逐页描述区块结构、按钮文案和状态变化，便于后续进入线框图、PRD 或开发实现。

**Tech Stack:** Markdown、项目本地 docs 文档目录

## Global Constraints

- 整体风格参考主流外卖产品的信息密度与结构习惯。
- 视觉氛围偏夜间、克制、轻健康化，不做强烈搞笑风。
- 优先移动端单列布局。
- 不羞辱。
- 不说教。
- 不夸张制造焦虑。
- 本次为模拟点单，不会产生真实交易，也不会有真实商家接单。
- 不接真实支付。
- 不接真实商家。
- 不产生真实履约。
- 热量统一使用“预估热量”“约 xxx kcal”“仅供参考”等表达。

---

### Task 1: 建立设计文档目录与设计方案文档

**Files:**
- Create: `docs/superpowers/specs/2026-08-08-tonight-not-delivered-design.md`
- Create: `docs/superpowers/plans/2026-08-08-tonight-not-delivered-page-prototype.md`

**Interfaces:**
- Consumes: 无
- Produces: `docs/superpowers/specs/2026-08-08-tonight-not-delivered-design.md`，作为页面原型文档与后续实现计划的产品来源说明

- [ ] **Step 1: 写入设计方案文档**

```md
# 今晚不送达 设计方案

## 1. 项目概述
### 1.1 产品名称
今晚不送达

### 1.2 产品定义
一个面向夜间报复性点外卖用户的模拟点单减脂工具。
```

- [ ] **Step 2: 确认文档已覆盖产品定义、用户、流程、页面结构、数据规则与风险边界**

Run: `grep -E "产品定义|目标用户|完整用户动线|页面结构|数据规则|风险与边界" docs/superpowers/specs/2026-08-08-tonight-not-delivered-design.md`
Expected: 输出上述章节标题，确认设计方案结构完整

- [ ] **Step 3: 若目录不存在则创建 docs/superpowers/specs 与 docs/superpowers/plans**

```bash
mkdir -p docs/superpowers/specs docs/superpowers/plans
```

- [ ] **Step 4: 提交文档目录与设计方案**

```bash
git add docs/superpowers/specs/2026-08-08-tonight-not-delivered-design.md docs/superpowers/plans/2026-08-08-tonight-not-delivered-page-prototype.md
git commit -m "docs: add tonight-not-delivered design assets"
```

### Task 2: 编写页面原型文档

**Files:**
- Create: `docs/2026-08-08-今晚不送达-页面原型文档.md`
- Modify: `docs/superpowers/specs/2026-08-08-tonight-not-delivered-design.md`

**Interfaces:**
- Consumes: 设计方案文档中的页面结构、文案原则、风险边界
- Produces: `docs/2026-08-08-今晚不送达-页面原型文档.md`，供设计或开发逐页落地

- [ ] **Step 1: 为首页编写页面原型说明**

```md
## 页面 1：首页 / 夜宵推荐页

### 1. 页面目标
让用户一打开就进入“正在逛外卖”的熟悉心智。

### 2. 页面结构
- 页面标题：今晚想吃点什么？
- 副标题：可以先点，但不一定要真的吃到
- 搜索框占位：搜奶茶 / 炸鸡 / 烧烤 / 蛋糕
```

- [ ] **Step 2: 为商家页、商品详情弹层、购物车页编写逐页原型说明**

```md
## 页面 3：商家页
- 商家封面图
- 店名
- 评分
- 月售
- 菜单分类
- 商品卡片
- 购物车悬浮栏

## 页面 4：商品详情弹层
- 规格选择区
- 加料选择区
- 数量选择器
- 加入购物车按钮

## 页面 5：购物车页 / 购物车浮层
- 已选商品列表
- 商品数量调整
- 打包费 / 配送费 / 优惠金额
- 去结算按钮
```

- [ ] **Step 3: 为确认订单页、模拟支付页、配送等待页、结果结算页编写逐页原型说明**

```md
## 页面 7：模拟支付页
> 本次为模拟点单，不会产生真实交易，也不会有真实商家接单。
- 确认模拟支付

## 页面 8：配送等待页
- 剩余时间：04:32
- 商家备餐中
- 骑手已接单
- 正在赶往你的位置
- 即将送达

## 页面 9：结果结算页
- 本次成功拦截：1 单夜宵
- 避免摄入：824 kcal
- 节省金额：¥36
```

- [ ] **Step 4: 为页面原型文档补充页面跳转关系、关键状态说明与交付建议**

```md
## 4. 页面跳转关系
首页 → 品类页 / 商家页 → 商品详情弹层 → 购物车 → 确认订单页 → 模拟支付页 → 配送等待页 → 结果结算页

## 5. 关键状态说明
### 5.1 空购物车状态
- 文案：先挑几样今晚最想点的
```

- [ ] **Step 5: 运行文档自检**

Run: `grep -E "页面 1：|页面 7：|页面 8：|页面 9：|页面跳转关系|关键状态说明" docs/2026-08-08-今晚不送达-页面原型文档.md`
Expected: 输出对应章节标题，确认页面原型文档完整

- [ ] **Step 6: 提交页面原型文档**

```bash
git add docs/2026-08-08-今晚不送达-页面原型文档.md docs/superpowers/specs/2026-08-08-tonight-not-delivered-design.md
git commit -m "docs: add page prototype for tonight-not-delivered"
```

### Task 3: 执行文档自审并准备交付

**Files:**
- Modify: `docs/2026-08-08-今晚不送达-页面原型文档.md`
- Modify: `docs/superpowers/specs/2026-08-08-tonight-not-delivered-design.md`

**Interfaces:**
- Consumes: 已完成的设计方案文档与页面原型文档
- Produces: 自审后的最终交付文档，避免缺项、歧义或边界不清

- [ ] **Step 1: 检查 spec coverage，确认页面原型文档覆盖设计方案中的所有核心页面**

Run: `grep -E "首页|品类页|商家页|购物车|确认订单页|模拟支付页|配送等待页|结果结算页" docs/2026-08-08-今晚不送达-页面原型文档.md`
Expected: 输出所有核心页面章节，确认无缺页

- [ ] **Step 2: 检查 placeholder 与模糊表述**

Run: `grep -RniE "TODO|TBD|待定|后续补充|合适的|适当的" docs/2026-08-08-今晚不送达-页面原型文档.md docs/superpowers/specs/2026-08-08-tonight-not-delivered-design.md`
Expected: 无输出

- [ ] **Step 3: 检查边界文案在设计方案与页面原型文档中均已明确出现**

Run: `grep -Rni "本次为模拟点单，不会产生真实交易" docs/2026-08-08-今晚不送达-页面原型文档.md docs/superpowers/specs/2026-08-08-tonight-not-delivered-design.md`
Expected: 两个文件均有命中

- [ ] **Step 4: 最终整理文档并准备交付说明**

```md
交付内容：
1. docs/superpowers/specs/2026-08-08-tonight-not-delivered-design.md
2. docs/2026-08-08-今晚不送达-页面原型文档.md
```

- [ ] **Step 5: 提交最终自审结果**

```bash
git add docs/superpowers/specs/2026-08-08-tonight-not-delivered-design.md docs/2026-08-08-今晚不送达-页面原型文档.md
git commit -m "docs: finalize tonight-not-delivered product docs"
```
