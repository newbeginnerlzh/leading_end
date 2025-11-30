// src/api/cart.ts
// import { get, post } from '@/utils/request'
import type { CartItem } from './model/cartModel'

/**
 * 获取购物车列表
 * @example
 * 返回: [{ id: 1, productId: 101, skuId: 201, count: 1, ... }]
 */
export function getCartList() {
  // 参考实现：
  // return get<CartItem[]>('/cart/list')
  return Promise.resolve([] as CartItem[])
}

/**
 * 添加到购物车
 * @param data { productId, skuId, count }
 * @example
 * addToCart({ productId: 101, skuId: 201, count: 1 })
 */
export function addToCart(data: { productId: number; skuId: number; count: number }) {
  void data
  // 参考实现：
  // return post('/cart/add', data)
  return Promise.resolve(null)
}

/**
 * 更新购物车商品数量或选中状态
 * @param data { id, count, checked }
 * @example
 * updateCartItem({ id: 1, count: 2 })
 */
export function updateCartItem(data: { id: number; count?: number; checked?: boolean }) {
  void data
  // 参考实现：
  // return post('/cart/update', data)
  return Promise.resolve(null)
}

/**
 * 删除购物车商品
 * @param ids 购物车项ID数组
 * @example
 * deleteCartItem([1, 2])
 */
export function deleteCartItem(ids: number[]) {
  void ids
  // 参考实现：
  // return post('/cart/delete', { ids })
  return Promise.resolve(null)
}

/**
 * 获取购物车商品数量（用于角标）
 */
export function getCartCount() {
  // 参考实现：
  // return get<number>('/cart/count')
  return Promise.resolve(0)
}
