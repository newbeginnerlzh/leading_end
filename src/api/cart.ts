// src/api/cart.ts
// import { get, post } from '@/utils/request'
import { get, post, put, del } from '@/utils/request'
import type { CartItem, BaseResponse } from './model/cartModel'

/**
 * 获取购物车列表
 *
 * @returns Promise<CartItem[]> 购物车条目数组
 *
 * @description
 * 后端需要返回当前登录用户的所有购物车条目。
 * 每个条目必须包含以下字段：
 * - id: 购物车条目的数据库ID（必需）
 * - productId: 商品ID（必需）
 * - skuId: SKU ID（必需）
 * - name: 商品名称（必需）
 * - imgUrl: 商品图片URL（必需）
 * - specs: 规格信息对象，如 { "硬盘": "1T", "显卡": "RTX 5060" }（必需）
 * - price: 单价（必需）
 * - count: 数量（必需）
 * - stock: 库存数量，用于前端限制最大购买数（可选但建议提供）
 * - selected: 选中状态，默认 true（可选，前端会自行管理）
 *
 * @example
 * 返回示例:
 * [
 *   {
 *     id: 1,
 *     productId: 101,
 *     skuId: 201,
 *     name: "游戏本",
 *     imgUrl: "https://example.com/img.jpg",
 *     specs: { "硬盘": "1T", "显卡": "RTX 5060" },
 *     price: 5999,
 *     count: 2,
 *     stock: 50,
 *     selected: true
 *   }
 * ]
 */
export async function getCartList() {
  // 正常
  const response = await get<BaseResponse<{ cartItems: CartItem[] }>>(`/api/cart/list`)
  // console.log(response.status, response.message)
  return response.data.cartItems || []
}

/**
 * 添加到购物车
 *
 * @param data { productId, skuId, count }
 * @returns Promise<CartItem> 返回新增或更新后的购物车条目（必须包含 id）
 *
 * @description
 * 后端逻辑：
 * 1. 检查该用户的购物车中是否已存在相同的 skuId
 * 2. 如果存在：数量累加，返回更新后的条目
 * 3. 如果不存在：新建条目，返回新条目（包含数据库生成的 id）
 * 4. 校验库存是否充足
 * 5. 校验商品和 SKU 是否有效
 *
 * ⚠️ 重要：返回的数据必须包含数据库生成的 id，前端需要用这个 id 进行后续操作
 *
 * @example
 * 请求: addToCart({ productId: 101, skuId: 201, count: 1 })
 * 返回示例:
 * {
 *   id: 888,              // ← 数据库生成的 ID（重要！）
 *   productId: 101,
 *   skuId: 201,
 *   name: "游戏本",
 *   imgUrl: "https://example.com/img.jpg",
 *   specs: { "硬盘": "1T" },
 *   price: 5999,
 *   count: 1,
 *   stock: 50,
 *   selected: true
 * }
 */
export async function addToCart(data: { productId: number; skuId: number; count: number }) {
  // 正常
  const response = await post<BaseResponse<CartItem>>('/api/cart/add', data)
  // console.log(response.status, response.message)
  return response.data
}

/**
 * 更新购物车商品数量或选中状态
 *
 * @param data { id, count?, checked? }
 * @returns Promise<CartItem> 返回更新后的购物车条目
 *
 * @description
 * 后端逻辑：
 * 1. 使用 id（购物车条目的数据库主键）定位记录
 * 2. count 和 checked 都是可选参数，前端按需传递
 * 3. 如果传了 count，需要校验库存是否充足
 * 4. 校验该条目是否属于当前登录用户（权限校验）
 *
 * @example
 * 请求1: updateCartItem({ id: 888, count: 5 })  // 只更新数量
 * 请求2: updateCartItem({ id: 888, checked: true })  // 只更新选中状态
 * 请求3: updateCartItem({ id: 888, count: 3, checked: true })  // 同时更新
 *
 * 返回示例（更新后的购物车条目）:
 * {
 *   id: 888,
 *   productId: 101,
 *   skuId: 201,
 *   name: "游戏本",
 *   imgUrl: "https://example.com/img.jpg",
 *   specs: { "硬盘": "1T" },
 *   price: 5999,
 *   count: 5,          // ← 已更新
 *   stock: 50,
 *   selected: true
 * }
 */
export async function updateCartItem(data: { id: number; count?: number; selected?: boolean }) {
  // 正常
  const response = await put<BaseResponse<CartItem>>('/api/cart/update', data)
  // console.log(response.status, response.message)
  return response.data
}

/**
 * 删除购物车商品（批量删除）
 *
 * @param ids 购物车条目ID数组（数据库主键）
 * @returns Promise<void> 或 Promise<{ deletedCount: number }>
 *
 * @description
 * 后端逻辑：
 * 1. 使用 ids 数组批量删除购物车条目
 * 2. 校验每个 id 是否属于当前登录用户（权限校验）
 * 3. 删除成功后返回成功标识或删除数量
 *
 * @example
 * 请求: deleteCartItem([1, 2, 3])  // 删除 id 为 1, 2, 3 的购物车条目
 *
 * 返回示例（可选）:
 * {
 *   deletedCount: 3  // 成功删除的条目数
 * }
 * 或直接返回成功状态码 200
 */
export async function deleteCartItem(data: { ids: number[] }) {
  // 正常
  const response = await del<BaseResponse<number>>('api/cart/delete', data)
  // console.log(response.status, response.message)
  return response.data
}

/**
 * 获取购物车商品数量（用于顶部角标显示）
 *
 * @returns Promise<number> 购物车中商品的总数量
 *
 * @description
 * 后端逻辑：
 * 1. 查询当前登录用户的购物车
 * 2. 将所有购物车条目的 count 字段求和
 * 3. 返回总数量（不是条目数，而是商品数量总和）
 *
 * @example
 * 假设用户购物车有 3 个条目：
 * - 商品A，数量 2
 * - 商品B，数量 1
 * - 商品C，数量 5
 *
 * 返回: 8  // (2 + 1 + 5)
 */
export async function getCartCount() {
  // 正常
  try {
    const response = await get<BaseResponse<{ totalCount: number }>>('/api/cart/count')
    // 假设成功时 code === 200，且 data 是数字
    if (response.status === 200) {
      return response.data.totalCount ?? 0
    }
    console.warn('获取购物车数量失败:', response.message)
    return 0
  } catch (error) {
    console.error('请求购物车数量出错:', error)
    return 0
  }
}

/**
 * 批量更新选中状态（全选/取消全选）
 *
 * @param data { ids: 购物车条目ID数组, selected: 选中状态 }
 * @returns Promise<void> 或 Promise<{ updatedCount: number }>
 *
 * @description
 * 后端逻辑：
 * 1. 批量更新指定 ids 的购物车条目的 selected 字段
 * 2. 校验每个 id 是否属于当前登录用户（权限校验）
 * 3. 返回成功标识或更新数量
 *
 * 使用场景：
 * - 用户点击"全选"按钮时，传入所有购物车条目的 ids，selected: true
 * - 用户点击"取消全选"时，传入所有购物车条目的 ids，selected: false
 *
 * @example
 * 请求: batchUpdateSelected({ ids: [1, 2, 3], selected: true })
 *
 * 返回示例（可选）:
 * {
 *   updatedCount: 3  // 成功更新的条目数
 * }
 * 或直接返回成功状态码 200
 */
export async function batchUpdateSelected(data: { ids: number[]; selected: boolean }) {
  // 正常
  const response = await put<BaseResponse<number>>('api/cart/batch-select', data)
  // console.log(response.status, response.message)
  return response.data
}

/**
 * 按 SKU ID 删除购物车商品
 *
 * @param skuId SKU ID
 * @returns Promise<void>
 *
 * @description
 * 后端逻辑：
 * 1. 查找当前登录用户购物车中 skuId 匹配的条目
 * 2. 删除该条目
 * 3. 如果找不到匹配的条目，返回 404 或成功状态
 *
 * 使用场景：
 * - 前端使用 skuId 作为唯一标识时，无需知道数据库 id 即可删除
 * - 适用于前端还没有从后端获取 id 的场景
 *
 * @example
 * 请求: deleteCartItemBySku(201)
 * 返回: 成功状态码 200
 */
export async function deleteCartItemBySku(skuId: number) {
  // 正常
  const response = await del<BaseResponse<void>>(`api/cart/delete-by-sku/${skuId}`)
  // console.log(response.status, response.message)
  if (response.status !== 200) {
    throw new Error(response.message)
  }
}

/**
 * 清空当前用户的整个购物车
 *
 * @returns Promise<void>
 *
 * @description
 * 后端逻辑：
 * 1. 获取当前登录用户 ID
 * 2. 删除该用户购物车中的所有商品条目
 * 3. 无论购物车是否为空，均返回成功状态（幂等操作）
 *
 * 使用场景：
 * - 用户点击“清空购物车”按钮
 * - 登录后同步本地购物车，需先清空再重建
 * - 下单成功后自动清空购物车
 *
 * @example
 * 请求: clearCart()
 * 返回: 成功状态码 200，data 为 null
 */
export async function clearCart() {
  // 正常
  const response = await del<BaseResponse<null>>('api/cart/clear')
  // console.log(response.status, response.message)
  if (response.status !== 200) {
    throw new Error(response.message)
  }
}
