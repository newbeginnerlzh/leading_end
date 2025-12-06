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
  // 支持前端结算页传入的完整信息（用于 mock 后端）
  address?: { name: string; phone: string; address: string }
  payment?: string
  shipping?: number
  remark?: string
  items?: { id: number; name: string; price: number; qty: number; imgUrl?: string }[]
}) {
  // 模拟后端生成完整订单并保存到 localStorage
  const id = `ORD-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`
  const subtotal = (data.items || []).reduce((s, it) => s + it.price * it.qty, 0)
  const shipping = data.shipping ?? 0
  const order = {
    id,
    status: 10, // 10:待支付
    createTime: new Date().toISOString(),
    totalPrice: Number((subtotal + shipping).toFixed(2)),
    payPrice: Number((subtotal + shipping).toFixed(2)),
    receiverName: data.address?.name || '',
    receiverPhone: data.address?.phone || '',
    receiverAddress: data.address?.address || '',
    items: (data.items || []).map((it) => ({
      productId: it.id,
      name: it.name,
      skuSpecStr: '',
      price: it.price,
      count: it.qty,
      imgUrl: it.imgUrl || '',
    })),
  }

  try {
    const key = 'mock_orders'
    const raw = localStorage.getItem(key)
    const arr = raw ? JSON.parse(raw) : []
    arr.push(order)
    localStorage.setItem(key, JSON.stringify(arr, null, 2))
  } catch (e) {
    // ignore storage errors in mock
    void e
  }

  return Promise.resolve(order)
}

/**
 * 获取订单列表
 * @param params { status, page, pageSize }
 * status: 0-全部, 10-待支付, 20-待发货, 30-待收货, 40-已完成
 */
export function getOrderList(params: { status?: number; page?: number; pageSize?: number }) {
  const { status, page = 1, pageSize = 10 } = params || {}
  try {
    const raw = localStorage.getItem('mock_orders')
    const arr: Order[] = raw ? JSON.parse(raw) : []
    let list = arr
    if (typeof status !== 'undefined' && status !== 0) {
      list = list.filter((o) => o.status === status)
    }
    const total = list.length
    const start = (page - 1) * pageSize
    const end = start + pageSize
    const pageList = list.slice(start, end)
    return Promise.resolve({ list: pageList, total, page, pageSize } as unknown as PageResult<Order>)
  } catch (e) {
    return Promise.resolve({ list: [], total: 0, page: 1, pageSize: 10 } as unknown as PageResult<Order>)
  }
}

/**
 * 获取订单详情
 * @param id 订单号
 */
export function getOrderDetail(id: string) {
  try {
    const raw = localStorage.getItem('mock_orders')
    const arr: Order[] = raw ? JSON.parse(raw) : []
    const found = arr.find((o) => o.id === id)
    return Promise.resolve((found as Order) || ({} as Order))
  } catch (e) {
    return Promise.resolve({} as Order)
  }
}

/**
 * 模拟支付
 * @param id 订单号
 */
export function payOrder(id: string) {
  try {
    const raw = localStorage.getItem('mock_orders')
    const arr: Order[] = raw ? JSON.parse(raw) : []
    const idx = arr.findIndex((o) => o.id === id)
    if (idx >= 0) {
      const o = arr[idx]
      if (o) {
        o.status = 20 // 标记为已支付、待发货
        localStorage.setItem('mock_orders', JSON.stringify(arr, null, 2))
        return Promise.resolve(o)
      }
    }
    return Promise.resolve(null)
  } catch (e) {
    return Promise.reject(e)
  }
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
