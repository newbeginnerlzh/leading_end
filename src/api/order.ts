// 订单相关API完整实现

// 导入现有的模型
import type { BaseResponse, Order, OrderItem } from './model/orderModel';
import type { ApiResponse, PageResult } from './model/common';

// 单个商品创建订单请求参数类型定义
export interface BuyNowOrderRequest {
  addressId: number;           // 收货地址ID
  specId: number;             // 具体产品id
  quantity: number;           // 购买数量
  buyerRemark?: string;       // 买家留言（可选）
}

// 批量创建订单请求参数类型定义
export interface CreateOrdersFromCartRequest {
  addressId: number;
  cartItemIds: number[];
  buyerRemark?: string | null;
}

// 订单预览项类型定义
export interface OrderPreviewItem {
  productName: string;
  mainImage: string;
  quantity: number;
}

// 订单列表项类型定义（API返回的简化版订单信息）
export interface OrderListItem {
  orderSn: string;           // 订单号
  totalAmount: number;       // 总金额
  payAmount: number;         // 实付金额
  status: number;            // 订单状态
  statusText: string;        // 订单状态文本
  createdAt: string;         // 创建时间
  itemCount: number;         // 产品种类数量
  previewItems: OrderPreviewItem[]; // 产品预览列表
}

// 订单详情响应数据类型
export interface OrderDetailData {
  order: Order;           // 订单详情
  items: OrderItem[];     // 订单中的商品列表
}

// 订单列表响应数据类型
export interface OrderListData {
  total: number;             // 总记录数
  page: number;              // 当前页码
  pageSize: number;          // 每页数量
  orders: OrderListItem[];   // 订单列表
}

export interface OrderDetailResponse extends BaseResponse<OrderDetailData> {}
export interface OrderListResponse extends BaseResponse<OrderListData> {}

// 查询参数类型定义
export interface GetOrderListParams {
  page?: number;             // 页码，默认为1
  pageSize?: number;         // 每页数量，默认为10
  status?: number;           // 订单状态筛选
  startDate?: string;        // 开始日期
  endDate?: string;          // 结束日期
}

/**
 * 批量创建订单API - 从购物车获取
 * @param params - 创建订单的参数
 * @returns 订单创建结果
 */
export async function createOrdersFromCart(params: CreateOrdersFromCartRequest): Promise<BaseResponse<Order>> {
  const response = await fetch('/api/orders/from-cart', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // 如果需要认证，在这里添加Authorization头部
      // 'Authorization': `Bearer ${getToken()}`
    },
    body: JSON.stringify({
      addressId: params.addressId,
      cartItemIds: params.cartItemIds,
      buyerRemark: params.buyerRemark || null
    })
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result: BaseResponse<Order> = await response.json();
  return result;
}

/**
 * 单个商品创建订单API
 * @param params - 创建订单的参数
 * @returns 订单创建结果
 */
export async function buyNowOrder(params: BuyNowOrderRequest): Promise<BaseResponse<Order>> {
  const response = await fetch('/api/orders/buy-now', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // 如果需要认证，在这里添加Authorization头部
      // 'Authorization': `Bearer ${getToken()}`
    },
    body: JSON.stringify({
      addressId: params.addressId,
      specId: params.specId,
      quantity: params.quantity,
      buyerRemark: params.buyerRemark
    })
  });

  if (!response.ok) {
    // 根据不同的HTTP状态码抛出相应的错误
    const errorResponse = await response.text();
    let errorMessage = `HTTP error! status: ${response.status}`;
    
    try {
      const errorObj = JSON.parse(errorResponse);
      errorMessage = errorObj.message || errorMessage;
    } catch (e) {
      // 如果无法解析错误响应，则使用默认错误消息
    }
    
    throw new Error(errorMessage);
  }

  const result: BaseResponse<Order> = await response.json();
  return result;
}

/**
 * 获取订单列表API
 * @param params - 查询参数
 * @returns 订单列表
 */
export async function getOrderList(params?: GetOrderListParams): Promise<BaseResponse<OrderListData>> {
  // 构建查询参数
  const queryParams = new URLSearchParams();
  
  if (params?.page !== undefined) queryParams.append('page', params.page.toString());
  if (params?.pageSize !== undefined) queryParams.append('pageSize', params.pageSize.toString());
  if (params?.status !== undefined) queryParams.append('status', params.status.toString());
  if (params?.startDate) queryParams.append('startDate', params.startDate);
  if (params?.endDate) queryParams.append('endDate', params.endDate);

  const queryString = queryParams.toString();
  const url = `/api/orders${queryString ? '?' + queryString : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      // 如果需要认证，在这里添加Authorization头部
      // 'Authorization': `Bearer ${getToken()}`
    }
  });

  if (!response.ok) {
    // 根据不同的HTTP状态码抛出相应的错误
    const errorResponse = await response.text();
    let errorMessage = `HTTP error! status: ${response.status}`;
    
    try {
      const errorObj = JSON.parse(errorResponse);
      errorMessage = errorObj.message || errorMessage;
    } catch (e) {
      // 如果无法解析错误响应，则使用默认错误消息
    }
    
    throw new Error(errorMessage);
  }

  const result: BaseResponse<OrderListData> = await response.json();
  return result;
}

/**
 * 获取订单详情API
 * @param orderSn - 订单号
 * @returns 订单详情
 */
export async function getOrderDetail(orderSn: number | string): Promise<BaseResponse<OrderDetailData>> {
  const response = await fetch(`/api/orders/${orderSn}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      // 如果需要认证，在这里添加Authorization头部
      // 'Authorization': `Bearer ${getToken()}`
    }
  });

  if (!response.ok) {
    // 根据不同的HTTP状态码抛出相应的错误
    const errorResponse = await response.text();
    let errorMessage = `HTTP error! status: ${response.status}`;
    
    try {
      const errorObj = JSON.parse(errorResponse);
      errorMessage = errorObj.message || errorMessage;
    } catch (e) {
      // 如果无法解析错误响应，则使用默认错误消息
    }
    
    throw new Error(errorMessage);
  }

  const result: BaseResponse<OrderDetailData> = await response.json();
  return result;
}

// 使用示例
/*
// 批量创建订单示例
const createOrderExample = async () => {
  try {
    const params: CreateOrdersFromCartRequest = {
      addressId: 46,
      cartItemIds: [19, 54, 13],
      buyerRemark: '尽快发货'
    };
    
    const result = await createOrdersFromCart(params);
    console.log('订单创建成功:', result);
  } catch (error) {
    console.error('订单创建失败:', error);
  }
};

// 单个商品创建订单示例
const buyNowOrderExample = async () => {
  try {
    const params: BuyNowOrderRequest = {
      addressId: 18,
      specId: 45,
      quantity: 50,
      buyerRemark: 'do'
    };
    
    const result = await buyNowOrder(params);
    console.log('订单创建成功:', result);
  } catch (error) {
    console.error('订单创建失败:', error);
  }
};

// 获取订单列表示例
const getOrderListExample = async () => {
  try {
    const params: GetOrderListParams = {
      page: 1,
      pageSize: 10,
      status: 1,
      startDate: '2023-01-01',
      endDate: '2023-12-31'
    };
    
    const result = await getOrderList(params);
    console.log('获取订单列表成功:', result);
  } catch (error) {
    console.error('获取订单列表失败:', error);
  }
};

// 获取订单详情示例
const getOrderDetailExample = async () => {
  try {
    const orderSn = '100014'; // 示例订单号
    
    const result = await getOrderDetail(orderSn);
    console.log('获取订单详情成功:', result);
  } catch (error) {
    console.error('获取订单详情失败:', error);
  }
};
*/





//原先的 mock 实现，已被上述真实 API 替代


// function readOrders(): Order[] {
//   try {
//     const raw = localStorage.getItem(ORDERS_KEY)
//     const arr = raw ? JSON.parse(raw) : []
//     return Array.isArray(arr) ? arr : []
//   } catch {
//     return []
//   }
// }

// function writeOrders(list: Order[]) {
//   try {
//     localStorage.setItem(ORDERS_KEY, JSON.stringify(list))
//   } catch {
//     // ignore
//   }
// }

// function readCart(): any[] {
//   try {
//     const raw = localStorage.getItem(CART_KEY)
//     const arr = raw ? JSON.parse(raw) : []
//     return Array.isArray(arr) ? arr : []
//   } catch {
//     return []
//   }
// }

// function writeCart(list: any[]) {
//   try {
//     localStorage.setItem(CART_KEY, JSON.stringify(list))
//   } catch {
//     // ignore
//   }
// }

// function readAddresses(): any[] {
//   try {
//     const raw = localStorage.getItem(ADDR_KEY)
//     const arr = raw ? JSON.parse(raw) : []
//     return Array.isArray(arr) ? arr : []
//   } catch {
//     return []
//   }
// }

// function genId() {
//   return 'ORD' + Date.now().toString(36) + Math.floor(Math.random() * 9000 + 1000).toString()
// }

// export function createOrder(data: {
//   addressId?: number
//   // 可选：直接传入临时地址对象（未保存到地址列表）
//   address?: { name?: string; phone?: string; address?: string; province?: string; city?: string; district?: string; detail?: string }
//   couponId?: number
//   remark?: string
//   // items 可以包含更多字段（name/price/imgUrl/productId），用于 direct purchase 场景
//   items?: { skuId: number; count: number; name?: string; price?: number; imgUrl?: string; productId?: number }[]
// }) {
//   return new Promise<{ orderId: string }>((resolve) => {
//     const orders = readOrders()
//     let orderItems: OrderItem[] = []
//     let total = 0

//     let cartSkuIds: number[] = []
//     if (data.items && Array.isArray(data.items) && data.items.length > 0) {
//       const cart = readCart()
//       orderItems = data.items.map((it) => {
//         const found = cart.find((c: any) => (c.skuId ?? c.id ?? c.productId) === it.skuId)
//         // 优先使用 cart 中的数据；如果不存在（direct purchase），使用 payload 中的字段回退
//         const price = found?.price ?? it.price ?? 0
//         const name = found?.name ?? it.name ?? '商品'
//         const img = found?.imgUrl ?? it.imgUrl ?? found?.mainImage ?? ''
//         const productId = found?.productId ?? it.productId ?? 0
//         total += price * (it.count || 0)
//         // 记录 skuId，便于支付后从购物车清理（如果该 sku 同时也在购物车）
//         cartSkuIds.push(it.skuId)
//         return { productId, name, skuSpecStr: '', price, count: it.count || 0, imgUrl: img } as OrderItem
//       })
//     } else {
//       const cart = readCart()
//       const selected = cart.filter((c: any) => (typeof c.selected === 'undefined' ? true : !!c.selected))
//       selected.forEach((c: any) => {
//         const count = c.count ?? c.qty ?? 1
//         const price = c.price ?? 0
//         const name = c.name ?? c.title ?? '商品'
//         const img = c.imgUrl ?? c.mainImage ?? ''
//         total += price * count
//         orderItems.push({ productId: c.productId ?? 0, name, skuSpecStr: '', price, count, imgUrl: img })
//         cartSkuIds.push(c.skuId ?? c.id ?? c.productId)
//       })
//       // 不在此处从购物车删除项，删除将在支付成功时执行
//     }

//     const id = genId()
//     let addr: any = {}
//     if (typeof data.addressId !== 'undefined') {
//       addr = readAddresses().find((a: any) => a.id === data.addressId) || {}
//     } else if (data.address) {
//       // 使用临时地址对象
//       addr = { name: data.address.name || '', phone: data.address.phone || '', address: data.address.address || data.address.detail || '' }
//     }
//     const order: Order = {
//       id,
//       status: 10, // 待支付
//       createTime: new Date().toISOString(),
//       totalPrice: total,
//       payPrice: total,
//       receiverName: addr.name || '',
//       receiverPhone: addr.phone || '',
//       receiverAddress: addr.address || '',
//       items: orderItems,
//       cartSkuIds: cartSkuIds.length > 0 ? cartSkuIds : undefined,
//     }
//     orders.unshift(order)
//     writeOrders(orders)
//     resolve({ orderId: id })
//   })
// }

// export function getOrderList(params: { status?: number; page?: number; pageSize?: number }) {
//   return new Promise<PageResult<Order>>((resolve) => {
//     const { status, page = 1, pageSize = 20 } = params || {}
//     let orders = readOrders()
//     if (typeof status !== 'undefined' && status !== 0) {
//       orders = orders.filter((o) => o.status === status)
//     }
//     const total = orders.length
//     const start = (page - 1) * pageSize
//     const list = orders.slice(start, start + pageSize)
//     resolve({ list, total, page, pageSize })
//   })
// }

// export function getOrderDetail(id: string) {
//   return new Promise<Order | Record<string, never>>((resolve) => {
//     const orders = readOrders()
//     const found = orders.find((o) => o.id === id)
//     resolve(found || ({} as Record<string, never>))
//   })
// }

// export function payOrder(id: string) {
//   return new Promise<null>((resolve, reject) => {
//     try {
//       const orders = readOrders()
//       const idx = orders.findIndex((o) => o.id === id)
//       if (idx === -1) return reject(new Error('订单不存在'))
//       const o = orders[idx]
//       if (o) {
//         o.status = 20 // 已支付，待发货
//         writeOrders(orders)
//         // 支付成功后，如果订单记录了 cartSkuIds，则从购物车中删除对应的 sku
//         try {
//           const skuIds: number[] | undefined = (o as any).cartSkuIds
//           if (Array.isArray(skuIds) && skuIds.length > 0) {
//             const cart = readCart()
//             const rem = cart.filter((c: any) => !skuIds.includes(c.skuId ?? c.id ?? c.productId))
//             writeCart(rem)
//           }
//         } catch {
//           // ignore cart cleanup errors
//         }
//         resolve(null)
//       } else {
//         reject(new Error('订单不存在'))
//       }
//     } catch (e) {
//       reject(e)
//     }
//   })
// }

// export function cancelOrder(id: string) {
//   return new Promise<null>((resolve, reject) => {
//     try {
//       const orders = readOrders()
//       const idx = orders.findIndex((o) => o.id === id)
//       if (idx === -1) return reject(new Error('订单不存在'))
//       const o = orders[idx]
//       if (!o) return reject(new Error('订单不存在'))
//       o.status = 0 // 取消
//       writeOrders(orders)
//       resolve(null)
//     } catch (e) {
//       reject(e)
//     }
//   })
// }

// export function confirmReceipt(id: string) {
//   return new Promise<null>((resolve, reject) => {
//     try {
//       const orders = readOrders()
//       const idx = orders.findIndex((o) => o.id === id)
//       if (idx === -1) return reject(new Error('订单不存在'))
//       const o = orders[idx]
//       if (!o) return reject(new Error('订单不存在'))
//       o.status = 40 // 已完成
//       writeOrders(orders)
//       resolve(null)
//     } catch (e) {
//       reject(e)
//     }
//   })
// }

// export function deleteOrder(id: string) {
//   return new Promise<null>((resolve, reject) => {
//     try {
//       const orders = readOrders()
//       const idx = orders.findIndex((o) => o.id === id)
//       if (idx === -1) return reject(new Error('订单不存在'))
//       orders.splice(idx, 1)
//       writeOrders(orders)
//       resolve(null)
//     } catch (e) {
//       reject(e)
//     }
//   })
// }
