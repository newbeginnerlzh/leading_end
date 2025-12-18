


export interface BaseResponse<T> {
  status: number
  message: string
  data: T // 这里才是真正的具体数据
}

export interface Order {
    /**
     * 买家留言
     */
    buyerRemark?: string;
    /**
     * 取消原因
     */
    cancelReason?: null | string;
    /**
     * 取消时间
     */
    cancelTime?: Date | null;
    /**
     * 确认收货时间
     */
    confirmTime?: Date | null;
    /**
     * 创建时间
     */
    createdAt?: Date;
    /**
     * 折扣了多少钱
     */
    discountAmount?: number;
    /**
     * 订单的数据库id
     */
    id?: number;
    /**
     * 订单号
     */
    orderSn?: string;
    /**
     * 实付金额 = total_amount - discount_amount + shipping_fee
     */
    payAmount?: number;
    /**
     * 未支付，支付宝，微信支付，银行卡
     */
    paymentMethod?: string;
    /**
     * 支付时间
     */
    payTime?: Date;
    /**
     * 接收者的城市
     */
    receiverCity?: string;
    /**
     * 接收者的详细地址
     */
    receiverDetail?: string;
    /**
     * 接收者的地区
     */
    receiverDistrict?: string;
    /**
     * 接收者的姓名
     */
    receiverName?: string;
    /**
     * 接收者的电话
     */
    receiverPhone?: string;
    /**
     * 接收者的邮政编码
     */
    receiverPostalCode?: string;
    /**
     * 接收者的省份
     */
    receiverProvince?: string;
    /**
     * 运费
     */
    shippingFee?: number;
    /**
     * 配送方式
     */
    shippingMethod?: string;
    /**
     * 发货时间
     */
    shippingTime?: Date | null;
    /**
     * 订单状态：待付款，待发货，待收货，已完成，已取消，退款中，退款成功，退款失败
     */
    status?: string;
    /**
     * 总价
     */
    totalAmount?: number;
    /**
     * 快递单号
     */
    trackingNumber?: string;
    /**
     * 更新时间
     */
    updatedAt?: Date;
    /**
     * 订单所属的用户id
     */
    userId?: number;
    //[property: number]: any;
}

export interface OrderItem {
    /**
     * 商品id，在products
     */
    id?: number;
    /**
     * 图片url
     */
    mainImage?: string;
    /**
     * 价格
     */
    price?: number;
    /**
     * 商品名称
     */
    productName?: string;
    /**
     * 数量
     */
    quantity?: number;
    /**
     * skuId，在sku数据库里面
     */
    skuId?: number;
    skuSpecs?: { [key: string]: any };
    /**
     * 总价
     */
    totalPrice?: number;
    //[property: string]: any;
}
