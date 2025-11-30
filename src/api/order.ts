// src/api/order.ts
// import { get, post } from '@/utils/request'
import type { Order } from './model/orderModel'
import type { PageResult } from './model/common'

/**
 * 创建订单（结算）
 * @param data { addressId, couponId, remark, items: [{ skuId, count }] }
 * 如果是从购物车结算，后端会清空对应购物车项
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
