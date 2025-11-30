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
}

export interface OrderItem {
  productId: number
  name: string
  skuSpecStr: string
  price: number
  count: number
  imgUrl: string
}
