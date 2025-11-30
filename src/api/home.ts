// src/api/home.ts
// import { get } from '@/utils/request'
import type { ProductSimple } from './model/productModel'

// 首页数据接口定义
export interface HomeData {
  banners: BannerItem[]
  hotProducts: ProductSimple[]
  newArrivals: ProductSimple[]
}

export interface BannerItem {
  id: number
  imgUrl: string
  linkUrl: string
  title: string
}

/**
 * 获取首页聚合数据
 * 包括轮播图、热销商品、新品推荐
 *
 * @example
 * 返回数据示例:
 * {
 *   code: 200,
 *   msg: "success",
 *   data: {
 *     banners: [{ id: 1, imgUrl: "...", title: "新品首发" }],
 *     hotProducts: [{ id: 101, name: "Y9000P", price: 9999, ... }],
 *     newArrivals: [...]
 *   }
 * }
 */
export function getHomeData() {
  // 参考实现：
  // return get<HomeData>('/home/index')
  return Promise.resolve({} as HomeData)
}
