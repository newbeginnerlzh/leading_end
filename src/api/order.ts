// src/api/order.ts
// import { get, post } from '@/utils/request'
import type { Order } from './model/orderModel'
import type { PageResult } from './model/common'

/**
 * 创建订单（结算）
 *
 * @param data 订单创建参数
 * @returns Promise<{ orderId: string }> 返回新创建的订单ID
 *
 * @description
 * 后端实现逻辑（核心）：
 * 该接口需要支持两种下单模式，通过 `items` 参数是否存在来区分。
 *
 * 模式 1：【购物车结算】 (当 `items` 为空或 undefined 时)
 * 1. 后端直接查询当前登录用户的【购物车表】。
 * 2. 筛选出所有 `selected = true` (被勾选) 的商品条目。
 * 3. 校验这些商品库存、价格是否变动。
 * 4. 创建订单。
 * 5. ⚠️ 关键：下单成功后，必须从购物车表中【物理删除】这些已结算的条目。
 *
 * 模式 2：【直接购买】 (当 `items` 有值时)
 * 1. 此时忽略购物车中的选中状态。
 * 2. 直接使用参数中的 itemsList (`skuId` + `count`) 进行下单。
 * 3. 校验传入的 SKU 库存和有效性。
 * 4. 创建订单。
 * 5. ⚠️ 注意：这【不影响】购物车中的数据（除非需求规定直接购买也要清空对应购物车项）。
 *
 * 通用逻辑：
 * - 扣减对应 SKU 的库存。
 * - 校验优惠券 (`couponId`) 有效性。
 * - 关联收货地址 (`addressId`)。
 *
 * @example
 * // 场景1：购物车结算（不传 items）
 * createOrder({ addressId: 1, couponId: 101 })
 *
 * // 场景2：商品详情页直接购买
 * createOrder({
 *   addressId: 1,
 *   items: [{ skuId: 201, count: 1 }]
 * })
 */
export function createOrder(data: {
  addressId: number
  couponId?: number
  remark?: string
  items?: { skuId: number; count: number }[]
}) {
  void data
  // 参考实现：
  // return post<{ orderId: string }>('/order/create', data)
  return Promise.resolve({ orderId: 'mock-order-id' })
}

/**
 * 获取订单列表
 * @param params { status, page, pageSize }
 * status: 0-全部, 10-待支付, 20-待发货, 30-待收货, 40-已完成
 */
export function getOrderList(params: { status?: number; page?: number; pageSize?: number }) {
  void params
  // 参考实现：
  // return get<PageResult<Order>>('/order/list', params)
  return Promise.resolve({ list: [], total: 0 } as unknown as PageResult<Order>)
}

/**
 * 获取订单详情
 * @param id 订单号
 */
export function getOrderDetail(id: string) {
  void id
  // 参考实现：
  // return get<Order>(`/order/detail/${id}`)
  return Promise.resolve({} as Order)
}

/**
 * 模拟支付
 * @param id 订单号
 */
export function payOrder(id: string) {
  void id
  // 参考实现：
  // return post('/order/pay', { orderId: id })
  return Promise.resolve(null)
}

/**
 * 取消订单
 * @param id 订单号
 */
export function cancelOrder(id: string) {
  void id
  // 参考实现：
  // return post('/order/cancel', { orderId: id })
  return Promise.resolve(null)
}

/**
 * 确认收货
 * @param id 订单号
 */
export function confirmReceipt(id: string) {
  void id
  // 参考实现：
  // return post('/order/confirm', { orderId: id })
  return Promise.resolve(null)
}
