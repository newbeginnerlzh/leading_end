// 订单相关API完整实现

import { get, post, patch, del } from '@/utils/request'
// 导入现有的模型
import type { BaseResponse, Order, OrderItem } from './model/orderModel';

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
  status: string;            // 订单状态
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

// 注：如需要更具体的响应类型别名，可在使用处直接引用 BaseResponse<OrderDetailData>/<OrderListData>

// 查询参数类型定义
export interface GetOrderListParams {
  page?: number;             // 页码，默认为1
  pageSize?: number;         // 每页数量，默认为10
  status?: number;           // 通过订单状态进行筛选 0-待付款，1-待发货，2-待收货，3-已完成，4-已取消，5-退款中，6-退款成功，7-退款失败
  startDate?: string;        // 开始日期
  endDate?: string;          // 结束日期
  orderSn?: string;          // 严格匹配的订单号
  productName?: string;      // 模糊匹配的商品名
}

// 操作类型枚举
export enum OrderAction {
  CONFIRM_RECEIPT = 0,  // 确认收货
  CANCEL_ORDER = 1,     // 取消订单
  APPLY_REFUND = 2,     // 申请退款
  PAY_ORDER = 3         // 支付订单
}

// 更新订单状态请求参数类型定义
export interface UpdateOrderStatusRequest {
  action: OrderAction;   // 操作类型
  reason?: string | null; // 操作原因（可选）
}

/**
 * 批量创建订单API - 从购物车获取
 * @param params - 创建订单的参数
 * @returns 订单创建结果
 */
export async function createOrdersFromCart(params: CreateOrdersFromCartRequest): Promise<BaseResponse<Order>> {
  const response = await post<BaseResponse<Order>>('/api/orders/from-cart', {
    addressId: params.addressId,
    cartItemIds: params.cartItemIds,
    buyerRemark: params.buyerRemark ?? null
  })
  return response
}

/**
 * 单个商品创建订单API
 * @param params - 创建订单的参数
 * @returns 订单创建结果
 */
export async function buyNowOrder(params: BuyNowOrderRequest): Promise<BaseResponse<Order>> {
  const response = await post<BaseResponse<Order>>('/api/orders/buy-now', {
    addressId: params.addressId,
    specId: params.specId,
    quantity: params.quantity,
    buyerRemark: params.buyerRemark
  })
  return response
}

/**
 * 获取订单列表API
 * @param params - 查询参数
 * @returns 订单列表
 */
export async function getOrderList(params?: GetOrderListParams): Promise<BaseResponse<OrderListData>> {
  const response = await get<BaseResponse<OrderListData>>('/api/orders', {
    page: params?.page,
    pageSize: params?.pageSize,
    status: params?.status,
    startDate: params?.startDate,
    endDate: params?.endDate,
    orderSn: params?.orderSn,
    productName: params?.productName
  })
  return response
}

/**
 * 获取订单详情API
 * @param orderSn - 订单号
 * @returns 订单详情
 */
export async function getOrderDetail(orderSn: number | string): Promise<BaseResponse<OrderDetailData>> {
  const response = await get<BaseResponse<OrderDetailData>>(`/api/orders/${orderSn}`)
  return response
}

/**
 * 更新订单状态API
 * 用户操作订单（确认收货、取消订单等）
 *
 * @param orderSn - 订单号
 * @param params - 更新订单状态的参数
 * @returns 更新结果
 */
export async function updateOrderStatus(orderSn: string, params: UpdateOrderStatusRequest): Promise<BaseResponse<null>> {
  const response = await patch<BaseResponse<null>>(`/api/orders/${orderSn}`, {
    action: params.action,
    reason: params.reason ?? null
  })
  return response
}


/**
 * 删除历史订单API
 * 功能是直接把订单从数据库中整个删除
 * 注意只能修改以下几种的订单
 * 3-已完成
 * 4-已取消
 * 6-退款成功
 * 7-退款失败
 * 和订单状态强相关
 *
 * @param orderSn - 订单号
 * @returns 删除结果
 */
export async function deleteOrder(orderSn: string): Promise<BaseResponse<null>> {
  const response = await del<BaseResponse<null>>(`/api/orders/delete/${orderSn}`)
  return response
}


