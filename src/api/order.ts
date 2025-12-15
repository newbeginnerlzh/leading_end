
// Mock order API (localStorage-backed)
import type { Order, OrderItem } from './model/orderModel'
import type { PageResult } from './model/common'

const ORDERS_KEY = 'mock_orders'
const CART_KEY = 'mock_cart'
const ADDR_KEY = 'mock_addresses'

function readOrders(): Order[] {
  try {
    const raw = localStorage.getItem(ORDERS_KEY)
    const arr = raw ? JSON.parse(raw) : []
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

function writeOrders(list: Order[]) {
  try {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(list))
  } catch {
    // ignore
  }
}

function readCart(): any[] {
  try {
    const raw = localStorage.getItem(CART_KEY)
    const arr = raw ? JSON.parse(raw) : []
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

function writeCart(list: any[]) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(list))
  } catch {
    // ignore
  }
}

function readAddresses(): any[] {
  try {
    const raw = localStorage.getItem(ADDR_KEY)
    const arr = raw ? JSON.parse(raw) : []
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

function genId() {
  return 'ORD' + Date.now().toString(36) + Math.floor(Math.random() * 9000 + 1000).toString()
}

export function createOrder(data: {
  addressId?: number
  // 可选：直接传入临时地址对象（未保存到地址列表）
  address?: { name?: string; phone?: string; address?: string; province?: string; city?: string; district?: string; detail?: string }
  couponId?: number
  remark?: string
  // items 可以包含更多字段（name/price/imgUrl/productId），用于 direct purchase 场景
  items?: { skuId: number; count: number; name?: string; price?: number; imgUrl?: string; productId?: number }[]
}) {
  return new Promise<{ orderId: string }>((resolve) => {
    const orders = readOrders()
    let orderItems: OrderItem[] = []
    let total = 0

    let cartSkuIds: number[] = []
    if (data.items && Array.isArray(data.items) && data.items.length > 0) {
      const cart = readCart()
      orderItems = data.items.map((it) => {
        const found = cart.find((c: any) => (c.skuId ?? c.id ?? c.productId) === it.skuId)
        // 优先使用 cart 中的数据；如果不存在（direct purchase），使用 payload 中的字段回退
        const price = found?.price ?? it.price ?? 0
        const name = found?.name ?? it.name ?? '商品'
        const img = found?.imgUrl ?? it.imgUrl ?? found?.mainImage ?? ''
        const productId = found?.productId ?? it.productId ?? 0
        total += price * (it.count || 0)
        // 记录 skuId，便于支付后从购物车清理（如果该 sku 同时也在购物车）
        cartSkuIds.push(it.skuId)
        return { productId, name, skuSpecStr: '', price, count: it.count || 0, imgUrl: img } as OrderItem
      })
    } else {
      const cart = readCart()
      const selected = cart.filter((c: any) => (typeof c.selected === 'undefined' ? true : !!c.selected))
      selected.forEach((c: any) => {
        const count = c.count ?? c.qty ?? 1
        const price = c.price ?? 0
        const name = c.name ?? c.title ?? '商品'
        const img = c.imgUrl ?? c.mainImage ?? ''
        total += price * count
        orderItems.push({ productId: c.productId ?? 0, name, skuSpecStr: '', price, count, imgUrl: img })
        cartSkuIds.push(c.skuId ?? c.id ?? c.productId)
      })
      // 不在此处从购物车删除项，删除将在支付成功时执行
    }

    const id = genId()
    let addr: any = {}
    if (typeof data.addressId !== 'undefined') {
      addr = readAddresses().find((a: any) => a.id === data.addressId) || {}
    } else if (data.address) {
      // 使用临时地址对象
      addr = { name: data.address.name || '', phone: data.address.phone || '', address: data.address.address || data.address.detail || '' }
    }
    const order: Order = {
      id,
      status: 10, // 待支付
      createTime: new Date().toISOString(),
      totalPrice: total,
      payPrice: total,
      receiverName: addr.name || '',
      receiverPhone: addr.phone || '',
      receiverAddress: addr.address || '',
      items: orderItems,
      cartSkuIds: cartSkuIds.length > 0 ? cartSkuIds : undefined,
    }
    orders.unshift(order)
    writeOrders(orders)
    resolve({ orderId: id })
  })
}

export function getOrderList(params: { status?: number; page?: number; pageSize?: number }) {
  return new Promise<PageResult<Order>>((resolve) => {
    const { status, page = 1, pageSize = 20 } = params || {}
    let orders = readOrders()
    if (typeof status !== 'undefined' && status !== 0) {
      orders = orders.filter((o) => o.status === status)
    }
    const total = orders.length
    const start = (page - 1) * pageSize
    const list = orders.slice(start, start + pageSize)
    resolve({ list, total, page, pageSize })
  })
}

export function getOrderDetail(id: string) {
  return new Promise<Order | Record<string, never>>((resolve) => {
    const orders = readOrders()
    const found = orders.find((o) => o.id === id)
    resolve(found || ({} as Record<string, never>))
  })
}

export function payOrder(id: string) {
  return new Promise<null>((resolve, reject) => {
    try {
      const orders = readOrders()
      const idx = orders.findIndex((o) => o.id === id)
      if (idx === -1) return reject(new Error('订单不存在'))
      const o = orders[idx]
      if (o) {
        o.status = 20 // 已支付，待发货
        writeOrders(orders)
        // 支付成功后，如果订单记录了 cartSkuIds，则从购物车中删除对应的 sku
        try {
          const skuIds: number[] | undefined = (o as any).cartSkuIds
          if (Array.isArray(skuIds) && skuIds.length > 0) {
            const cart = readCart()
            const rem = cart.filter((c: any) => !skuIds.includes(c.skuId ?? c.id ?? c.productId))
            writeCart(rem)
          }
        } catch {
          // ignore cart cleanup errors
        }
        resolve(null)
      } else {
        reject(new Error('订单不存在'))
      }
    } catch (e) {
      reject(e)
    }
  })
}

export function cancelOrder(id: string) {
  return new Promise<null>((resolve, reject) => {
    try {
      const orders = readOrders()
      const idx = orders.findIndex((o) => o.id === id)
      if (idx === -1) return reject(new Error('订单不存在'))
      const o = orders[idx]
      if (!o) return reject(new Error('订单不存在'))
      o.status = 0 // 取消
      writeOrders(orders)
      resolve(null)
    } catch (e) {
      reject(e)
    }
  })
}

export function confirmReceipt(id: string) {
  return new Promise<null>((resolve, reject) => {
    try {
      const orders = readOrders()
      const idx = orders.findIndex((o) => o.id === id)
      if (idx === -1) return reject(new Error('订单不存在'))
      const o = orders[idx]
      if (!o) return reject(new Error('订单不存在'))
      o.status = 40 // 已完成
      writeOrders(orders)
      resolve(null)
    } catch (e) {
      reject(e)
    }
  })
}

export function deleteOrder(id: string) {
  return new Promise<null>((resolve, reject) => {
    try {
      const orders = readOrders()
      const idx = orders.findIndex((o) => o.id === id)
      if (idx === -1) return reject(new Error('订单不存在'))
      orders.splice(idx, 1)
      writeOrders(orders)
      resolve(null)
    } catch (e) {
      reject(e)
    }
  })
}
