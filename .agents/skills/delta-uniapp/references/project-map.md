# UniApp 项目地图

## Delta 页面

```text
pages-worker/**
pages-delta/**
```

`pages-worker` 面向打手身份，`pages-delta` 面向老板、俱乐部或 Delta 履约业务。新增页面必须登记到 `pages.json` 对应分包。

## Delta API 与状态

```text
sheep/api/delta/**
sheep/store/delta.js
sheep/helper/delta*
```

## 通用底座

```text
sheep/request/index.js
sheep/config/index.js
sheep/store/user.js
sheep/api/member/auth.js
sheep/components/s-tabbar/**
```

## 已确认的请求行为

- `luch-request` 统一封装；
- `baseURL = baseUrl + apiPath`；
- `apiPath` 来自 `SHOPRO_API_PATH=/app-api`；
- 自动添加 Authorization、terminal、tenant-id；
- 401 自动刷新 token 或弹登录；
- API 返回 `code/data/msg`；
- Delta API 通常配置 `auth: true`。

## 验证注意

`package.json` 只有 prettier 写入脚本，没有标准 mp-weixin build 脚本。不要声称 `pnpm build` 已通过。
