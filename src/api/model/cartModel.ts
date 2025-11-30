// src/api/model/cartModel.ts
export interface CartItem {
  id: number // 购物车条目ID
  productId: number
  skuId: number
  name: string
  skuSpecStr: string // "i7 / 16G" 用于展示
  price: number
  count: number
  imgUrl: string
  stock: number // 用于限制最大购买数
  checked?: boolean // 前端辅助字段，后端不需要给，前端自己加
}
