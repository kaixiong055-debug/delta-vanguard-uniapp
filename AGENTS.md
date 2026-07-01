# Delta UniApp 微信小程序仓库规则

## 仓库身份

本仓库是 **Shopro / UniApp / Vue3 微信小程序前端**。

Delta 现有主要范围：

```text
pages-worker/**
pages-delta/**
sheep/api/delta/**
sheep/store/delta.js
sheep/helper/delta*
pages.json
```

## 必须保留

- 微信登录；
- member 用户体系；
- 商品、SKU、购物车；
- 微信支付；
- 商城原订单；
- DIY 首页和个人中心；
- DIY JSON 协议与渲染器；
- 商城动态底部导航。

## 禁止

- 修改 Java 后端或 Vue3 管理后台；
- 重写登录和支付；
- 修改商城原订单状态；
- 把 Delta 服务订单与 `trade_order` 混为一体；
- 自建 axios/request；
- 写完整域名；
- 写 `/admin-api`；
- 调用后台管理接口；
- 前端提交任意 `tenantId`、`clubId`、`operatorId`；
- 创建后端不存在的 App API。

## 请求规则

统一使用：

```text
sheep/request
```

环境配置会自动拼接：

```text
BASE_URL + /app-api
```

因此 API 文件只写：

```text
/delta/**
```

需要登录的请求使用项目现有 `custom.auth`。

## 开工顺序

1. `git status --short`。
2. 检查 `pages.json` 分包和是否已有同名页面。
3. 检查 `sheep/api/delta/**` 和 `sheep/store/delta.js`。
4. 读取真实 App Controller、ReqVO、RespVO。
5. 如果只有 Admin API，停止真实接入，只搭页面壳或报告缺口。
6. 完成页面、刷新、分页、错误提示和防重复点击。
7. 不伪造履约入口或敏感字段。

## 验证

本仓库没有标准微信小程序构建脚本，不能虚构构建成功。

至少执行：

```bash
npx prettier --check "pages-worker/**/*.{js,vue}" "pages-delta/**/*.{js,vue}" "sheep/api/delta/**/*.js" "sheep/store/delta.js"
```

然后根据实际环境使用 HBuilderX 或微信开发者工具编译，并明确报告是否真实执行。

## 完成报告

列出：

- 页面与分包；
- App API 契约；
- 登录和身份来源；
- 敏感字段检查；
- 刷新、分页、防重复点击；
- 实际验证与未验证项。
