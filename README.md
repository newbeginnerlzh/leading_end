# online-mall-frontend

## 项目结构

src/
├── api/ # 接口文件 (后端接口调用)
├── assets/ # 静态资源
├── components/
│ ├── common/ # 通用组件 (Header, Footer, 导航栏等)
│ ├── client/ # 客户界面独有的小组件 (商品卡片、购物车图标)
│ └── admin/ # 管理界面独有的小组件 (数据卡片、筛选器)
├── router/
│ └── index.ts # 路由配置 (核心！用于分离两个界面)
├── stores/ # 状态管理 (存放状态仓库的定义文件，用于管理整个应用中的全局数据和共享状态)
├── views/
│ ├── client/ # 【客户界面】所有页面放在这里
│ │ └── HomeView.vue # 首页
│ └── admin/ # 【管理界面】所有页面放在这里
├── layouts/ # 布局文件夹
│ ├─ AdminLayout.vue # 管理界面骨架
│ └─ ClientLayout.vue # 客户界面骨架
├── main.ts
└── App.vue # 根组件，后期需要利用 Vue Router 提供的路由信息，实现动态切换布局

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
npm run test:unit
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```
