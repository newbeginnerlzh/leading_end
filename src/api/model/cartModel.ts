// src/api/model/cartModel.ts
/**
 * 购物车条目（统一前后端定义）
 */
export interface CartItem {
  id?: number // 购物车条目ID（后端返回时才有，前端新建时可选）
  productId: number
  skuId: number
  name: string
  imgUrl: string
  specs: Record<string, string> // 规格信息，如 { "硬盘": "1T", "显卡": "RTX 5060" }
  price: number
  count: number
  stock?: number // 库存数量（用于限制最大购买数，后端返回）
  selected: boolean // 选中状态（前端用于结算勾选）
}
