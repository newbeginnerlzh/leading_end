# API 层架构说明

## 目录结构

```
src/api/
├── model/              # TypeScript 类型定义
│   ├── common.ts       # 通用类型（ApiResponse, PageResult）
│   ├── userModel.ts    # 用户相关数据模型
│   ├── productModel.ts # 商品相关数据模型
│   ├── cartModel.ts    # 购物车数据模型
│   └── orderModel.ts   # 订单数据模型
├── home.ts             # 首页 API
├── user.ts             # 用户 API
├── product.ts          # 商品 API
├── cart.ts             # 购物车 API
└── order.ts            # 订单 API
```

---

## `model/` 文件夹的作用

### 1. **定义数据结构**

`model/` 文件夹集中管理所有 **后端返回的数据结构**，作为前后端数据契约的 TypeScript 表示。

### 2. **核心职责**

#### `common.ts` - 通用类型

- `ApiResponse<T>`: 统一的 API 响应格式
  ```typescript
  interface ApiResponse<T = unknown> {
    code: number
    msg: string
    data: T
  }
  ```
- `PageResult<T>`: 分页数据结构
  ```typescript
  interface PageResult<T> {
    list: T[]
    total: number
    page: number
    pageSize: number
  }
  ```

#### 业务模型文件（`userModel.ts`, `productModel.ts` 等）

- 定义**响应数据**的接口（即后端返回给前端的数据类型）
- 例如：
  - `UserInfo`: 用户信息
  - `ProductDetail`: 商品详情
  - `CartItem`: 购物车项
  - `Order`: 订单信息

### 3. **设计原则**

- ✅ **只定义响应数据结构**（后端返回的数据）
- ❌ **不定义请求参数接口**（API 函数的参数类型直接内联定义）
- 📌 这样可以让 model 文件更简洁，专注于数据模型本身

---

## API 文件的作用（`cart.ts`, `user.ts` 等）

### 1. **封装 HTTP 请求**

每个 API 文件对应一个业务模块，封装该模块的所有 HTTP 请求函数。

### 2. **文件结构示例**（以 `cart.ts` 为例）

```typescript
// 1. 导入类型定义
import type { CartItem } from './model/cartModel'

// 2. 定义 API 函数（函数签名即接口文档）
export function getCartList() {
  // 参考实现：
  // return get<CartItem[]>('/cart/list')
  return Promise.resolve([] as CartItem[])
}

export function addToCart(data: { productId: number; skuId: number; count: number }) {
  // 参考实现：
  // return post('/cart/add', data)
  return Promise.resolve(null)
}
```

### 3. **核心特点**

#### ✅ **类型安全**

- 所有函数参数都有明确的 TypeScript 类型
- 返回值类型使用从 `model/` 导入的接口

#### ✅ **自文档化**

- 参数类型直接内联在函数签名中，无需查找外部接口
- 配合 JSDoc 注释，形成完整的 API 文档
  ```typescript
  /**
   * 添加到购物车
   * @param data { productId, skuId, count }
   * @example
   * addToCart({ productId: 101, skuId: 201, count: 1 })
   */
  export function addToCart(data: { ... }) { ... }
  ```

#### ✅ **代码即注释**

- 当前实现是占位符（`Promise.resolve(...)`）
- 真正的请求逻辑以**注释形式**保留，供后续实现参考
  ```typescript
  // 参考实现：
  // return post('/cart/add', data)
  ```

### 4. **各 API 文件职责**

| 文件         | 职责                                   |
| ------------ | -------------------------------------- |
| `home.ts`    | 首页数据（轮播图、热销商品、新品推荐） |
| `user.ts`    | 用户登录、注册、个人信息、收货地址     |
| `product.ts` | 商品列表、商品详情、分类树             |
| `cart.ts`    | 购物车增删改查                         |
| `order.ts`   | 订单创建、查询、支付、取消、确认收货   |

---

## 使用示例

### 在组件中调用 API

```typescript
import { getCartList, addToCart } from '@/api/cart'

// 1. 获取购物车列表
const cartList = await getCartList()
// 类型推断：cartList 是 CartItem[]

// 2. 添加商品到购物车
await addToCart({
  productId: 101,
  skuId: 201,
  count: 1,
})
// TypeScript 会检查参数类型是否正确
```

---

## 设计优势

### 1. **职责分离**

- `model/`: 数据结构定义
- `api/*.ts`: 业务逻辑封装

### 2. **易于维护**

- 修改数据结构：只需改 `model/` 中的接口
- 修改 API 逻辑：只需改对应的 API 文件

### 3. **类型提示友好**

- IDE 可以直接在函数调用处看到完整的参数类型
- 无需跳转到其他文件查看接口定义

### 4. **便于后续实现**

- 函数签名已确定，后续只需取消注释并实现真实的请求逻辑
- 占位符实现方便前端开发时进行原型测试

---

## 开发流程建议

### 当前阶段（原型开发）

1. 使用 API 文件中的占位符函数进行前端开发
2. Mock 数据可以在组件层或通过 Mock Service Worker 实现

### 后端对接阶段

1. 确认后端 API 文档与函数签名一致
2. 取消注释 `// return get/post...` 的实现
3. 删除占位符的 `Promise.resolve(...)`
4. 测试真实接口调用

### 数据结构变更

1. 优先修改 `model/` 中的接口定义
2. TypeScript 会自动提示哪些地方需要同步修改
3. 确保类型安全的重构
