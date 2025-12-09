// src/api/model/orderModel.ts
export interface Order {
  id: string // 订单号
  status: number // 10:待支付, 20:待发货...
  createTime: string
  totalPrice: number
  payPrice: number
  receiverName: string
  receiverPhone: string
  receiverAddress: string
  items: OrderItem[]
  // 如果订单来源于购物车结算，这里保存相关的 skuId 列表，方便支付后清理购物车
  cartSkuIds?: number[]
}

export interface OrderItem {
  productId: number
  name: string
  skuSpecStr: string
  price: number
  count: number
  imgUrl: string
}
