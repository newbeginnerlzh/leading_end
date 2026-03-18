# online-mall-frontend

在线商城前端项目，基于 Vue 3 + Vite + TypeScript 构建，包含客户端页面、商品浏览、购物车、订单结算与用户中心等核心电商流程。

## 一、项目简介

本项目是一个前后端分离的商城前端工程，主要面向用户侧（Client）场景。

- 支持商品列表与商品详情浏览
- 支持购物车与订单结算流程
- 支持用户登录与个人中心相关页面
- 基于路由和布局进行模块化组织，便于后续扩展管理端

## 二、技术栈

### 1) 核心框架

- Vue 3（`vue`）
- Vite 7（`vite`）
- TypeScript 5（`typescript`）

### 2) 路由与状态管理

- Vue Router 4（`vue-router`）
- Pinia（`pinia`）
- Pinia 持久化插件（`pinia-plugin-persistedstate`）

### 3) UI 与样式

- Element Plus（`element-plus`）
- Sass（`sass`）
- `unplugin-auto-import` + `unplugin-vue-components`
- `ElementPlusResolver` 自动按需导入组件与 API

### 4) 网络请求与数据

- Axios（`axios`）
- 行政区划数据（`china-area-data`）

### 5) 工程化与质量保障

- 单元测试：Vitest（`vitest`）+ Vue Test Utils（`@vue/test-utils`）+ jsdom
- 代码规范：ESLint 9（`eslint`）
- 代码格式化：Prettier 3（`prettier`）
- 类型检查：`vue-tsc`

## 三、运行环境要求

- Node.js：`^20.19.0` 或 `>=22.12.0`
- npm：建议使用与 Node 版本匹配的较新版本

## 四、快速开始

### 1) 安装依赖

```sh
npm install
```

### 2) 启动开发环境

```sh
npm run dev
```

### 3) 生产构建（含类型检查）

```sh
npm run build
```

### 4) 本地预览构建结果

```sh
npm run preview
```

### 5) 运行单元测试

```sh
npm run test:unit
```

### 6) 代码检查与自动修复

```sh
npm run lint
```

### 7) 格式化代码

```sh
npm run format
```

## 五、项目目录结构

```text
.
├── public/                         # 公共静态资源
├── src/
│   ├── api/                        # 接口封装（按业务模块拆分）
│   │   ├── model/                  # 接口请求/响应类型模型
│   │   ├── cart.ts
│   │   ├── home.ts
│   │   ├── order.ts
│   │   ├── product.ts
│   │   └── user.ts
│   ├── assets/                     # 样式与图片等资源
│   ├── components/
│   │   └── client/                 # 客户端页面复用组件
│   ├── layouts/                    # 页面布局骨架
│   │   ├── ClientLayout.vue
│   │   └── AdminLayout.vue
│   ├── router/                     # 路由配置
│   ├── stores/                     # Pinia 状态仓库
│   ├── utils/                      # 通用工具（如请求封装）
│   ├── views/
│   │   └── client/                 # 客户端业务页面
│   ├── App.vue                     # 根组件
│   └── main.ts                     # 应用入口
├── vite.config.ts                  # Vite 配置（含代理、别名、插件）
├── vitest.config.ts                # Vitest 配置
├── eslint.config.ts                # ESLint 配置
└── package.json                    # 项目脚本与依赖
```

## 六、关键工程配置说明

### 1) 路径别名

项目在 Vite 中配置了 `@` 指向 `src` 目录，可直接使用如下方式导入：

```ts
import { xxx } from '@/utils/request'
```

### 2) 开发代理

开发环境将 `/api` 请求代理到后端服务：

- 代理前缀：`/api`
- 目标地址：`http://47.104.222.121:8080`

如需更换后端环境，请修改 [vite.config.ts](vite.config.ts) 中的 `server.proxy`。

### 3) 自动导入

通过 `unplugin-auto-import` 和 `unplugin-vue-components` 配置 Element Plus 自动按需导入，减少手动引入模板代码。

## 七、推荐开发工具

- 编辑器：VS Code
- Vue 插件：Vue - Official（Volar）
- 浏览器调试插件：Vue.js Devtools

## 八、后续可扩展方向

- 完善接口异常处理与统一错误提示
- 补充更多单元测试与关键流程测试用例
- 增加 CI 流程（Lint + Test + Build）
