


export interface BaseResponse<T> {
  status: number
  message: string
  data: T // 这里才是真正的具体数据
}

export interface Order {
    buyerRemark?: string;//买家留言
    cancelReason?: null | string;//取消原因
    cancelTime?: Date | null;//取消时间
    confirmTime?: Date | null;//确认收货时间
    createdAt?: Date;//创建时间
    discountAmount?: number;//折扣了多少钱
    id?: number;//订单的数据库id
    orderSn?: string;//订单号
    payAmount?: number;//实付金额 = total_amount - discount_amount + shipping_fee
    paymentMethod?: string;//未支付，支付宝，微信支付，银行卡
    payTime?: Date;//支付时间
    receiverCity?: string;//接收者的城市
    receiverDetail?: string;//接收者的详细地址
    receiverDistrict?: string;//接收者的地区
    receiverName?: string;// 接收者的姓名
    receiverPhone?: string;//接收者的电话
    receiverPostalCode?: string;//接收者的邮政编码
    receiverProvince?: string;//接收者的省份
    refundReason?: null | string;//退款原因
    refundTime?: Date | null;//退款时间
    shippingFee?: number;//运费
    shippingMethod?: string;//配送方式
    shippingTime?: Date | null;//发货时间
    status?: string;//订单状态：待付款，待发货，待收货，已完成，已取消，退款中，退款成功，退款失败
    totalAmount?: number;//总价
    trackingNumber?: string;//快递单号
    updatedAt?: Date;//更新时间
    userId?: number;//订单所属的用户id
}

export interface OrderItem {
  afterSaleStatus?: null | string;//售后状态
  id?: number;//商品id，在products
  mainImage?: string;//图片url
  price?: number;//价格
  productName?: string;//商品名称
  quantity?: number;//数量
  skuId?: number;//skuId，在sku数据库里面
  skuSpecs?: { [key: string]: any };
  totalPrice?: number;//总价
}
