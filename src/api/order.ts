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

export interface OrderDetailResponse extends BaseResponse<OrderDetailData> {}
export interface OrderListResponse extends BaseResponse<OrderListData> {}

// 查询参数类型定义
export interface GetOrderListParams {
  page?: number;             // 页码，默认为1
  pageSize?: number;         // 每页数量，默认为10
  status?: number;           // 通过订单状态进行筛选 0-待付款，1-待发货，2-待收货，3-已完成，4-已取消，5-退款中，6-退款成功，7-退款失败
  startDate?: string;        // 开始日期
  endDate?: string;          // 结束日期
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
  if (params?.status!== undefined) queryParams.append('status', params.status.toString());
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

/**
 * 更新订单状态API
 * 用户操作订单（确认收货、取消订单等）
 * 
 * @param orderSn - 订单号
 * @param params - 更新订单状态的参数
 * @returns 更新结果
 */
export async function updateOrderStatus(orderSn: string, params: UpdateOrderStatusRequest): Promise<BaseResponse<null>> {
  const response = await fetch(`/api/orders/${orderSn}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      // 如果需要认证，在这里添加Authorization头部
      // 'Authorization': `Bearer ${getToken()}`
    },
    body: JSON.stringify({
      action: params.action,
      reason: params.reason || null
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

  const result: BaseResponse<null> = await response.json();
  return result;
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
  const response = await fetch(`/api/orders/delete/${orderSn}`, {
    method: 'DELETE',
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

  const result: BaseResponse<null> = await response.json();
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

// 确认收货示例
const confirmReceiptExample = async () => {
  try {
    const orderSn = '100014'; // 示例订单号
    const params: UpdateOrderStatusRequest = {
      action: OrderAction.CONFIRM_RECEIPT
    };
    
    const result = await updateOrderStatus(orderSn, params);
    console.log('确认收货成功:', result);
  } catch (error) {
    console.error('确认收货失败:', error);
  }
};

// 取消订单示例
const cancelOrderExample = async () => {
  try {
    const orderSn = '100014'; // 示例订单号
    const params: UpdateOrderStatusRequest = {
      action: OrderAction.CANCEL_ORDER,
      reason: '不想要了'
    };
    
    const result = await updateOrderStatus(orderSn, params);
    console.log('取消订单成功:', result);
  } catch (error) {
    console.error('取消订单失败:', error);
  }
};

// 申请退款示例
const applyRefundExample = async () => {
  try {
    const orderSn = '100014'; // 示例订单号
    const params: UpdateOrderStatusRequest = {
      action: OrderAction.APPLY_REFUND,
      reason: '商品质量有问题'
    };
    
    const result = await updateOrderStatus(orderSn, params);
    console.log('申请退款成功:', result);
  } catch (error) {
    console.error('申请退款失败:', error);
  }
};

// 支付订单示例
const payOrderExample = async () => {
  try {
    const orderSn = '100014'; // 示例订单号
    const params: UpdateOrderStatusRequest = {
      action: OrderAction.PAY_ORDER
    };
    
    const result = await updateOrderStatus(orderSn, params);
    console.log('支付订单成功:', result);
  } catch (error) {
    console.error('支付订单失败:', error);
  }
};

//删除订单
const deleteOrderExample = async () => {
  try {
    const orderSn = '100014'; // 示例订单号
    
    const result = await deleteOrder(orderSn);
    console.log('订单删除成功:', result);
    console.log('状态码:', result.status);
    console.log('消息:', result.message);
  } catch (error) {
    console.error('删除订单失败:', error);
  }
};

*/
