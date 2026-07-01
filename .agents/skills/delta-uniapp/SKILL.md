---
name: delta-uniapp
description: 用于 Delta 先锋俱乐部 Shopro/UniApp 微信小程序、pages-worker、pages-delta、sheep/api/delta、sheep/store/delta.js、App API、分页刷新、登录身份和小程序页面任务。不要用于 Java 后端或 Vue3 管理后台。
---

# Delta UniApp 开发工作流

先读取仓库根目录 `AGENTS.md` 和 `references/project-map.md`。

## 1. 初始化检查

每次新功能先检查：

```text
pages.json
pages-worker/**
pages-delta/**
sheep/api/delta/**
sheep/store/delta.js
sheep/request/index.js
sheep/config/index.js
```

确认是否已有同名页面和 API，避免创建：

```text
orderMarket
order-market
order_market
```

三套重复目录。

## 2. 契约检查

只有真实 App Controller 存在时才能接入：

```text
/app-api/delta/**
```

API 文件中实际只写：

```text
/delta/**
```

必须核对：

- URL 和 HTTP 方法；
- Query 或 Body；
- ReqVO、RespVO；
- 登录要求；
- 当前 member 身份；
- 俱乐部或打手身份来源；
- 分页结构；
- 错误 message；
- 敏感字段。

只有 Admin Controller 时，不调用 `/admin-api`，只搭页面壳或报告后端缺口。

## 3. 页面规则

列表页面统一处理：

- 首次加载；
- 下拉刷新；
- 上拉分页；
- 空状态；
- 加载失败；
- 页码回滚；
- 防重复请求；
- 后端状态优先于本地倒计时。

提交操作统一处理：

- 二次确认；
- 独立 loading；
- 防重复点击；
- 不自动重试；
- 不提前修改本地业务状态；
- 成功后重新请求真实数据；
- 直接展示后端 message。

## 4. 安全边界

公共市场或未接单页面禁止展示：

```text
手机号
微信号
OpenID
UnionID
支付单号
退款账户
完整地址
登录账号
平台内部备注
```

前端不得提交：

```text
tenantId
clubId
operatorId
```

除非真实 App ReqVO 明确要求且后端有可信校验；发现此类设计需先报告。

## 5. Shopro 复用

必须复用：

- `sheep/request`；
- `sheep.$router`；
- `sheep.$store`；
- `s-layout`、`s-empty`、`uni-load-more`；
- 现有登录弹窗；
- 现有 token 刷新；
- 现有分包和页面风格。

不要重写商城底座。

## 6. 验证

执行格式检查：

```bash
npx prettier --check "pages-worker/**/*.{js,vue}" "pages-delta/**/*.{js,vue}" "sheep/api/delta/**/*.js" "sheep/store/delta.js"
```

有 HBuilderX 或微信开发者工具时再做真实编译。没有真实编译时必须写明“未完成小程序构建验证”。

## 输出格式

```text
页面：
App 接口：
身份与安全：
刷新分页：
验证：
后端缺口：
```
