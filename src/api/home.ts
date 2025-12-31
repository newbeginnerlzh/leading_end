// src/api/home.ts
import { get } from '@/utils/request'
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
  linkUrl?: string
  title?: string
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




// 定义接口返回的数据类型
export interface BannerItem {
  id: number
  imgUrl: string
  linkUrl?: string
  sortOrder?: number
  isActive?: number
}

// 轮播图 API 返回的数据格式
export interface CarouselApiResponse {
  status: number
  message: string
  data: BannerItem[]
}

export interface HomeCategory {
  id: number | string
  name: string
  subTitle: string
  themeColor: string
}

// API 返回的分类数据格式
export interface CategoryApiResponse {
  status: number
  message: string
  data: {
    data: HomeCategory[]
  }
}

// 默认分类样式配置
const defaultCategoryStyles: Record<string, { subTitle: string; themeColor: string }> = {
  'ThinkPad系列': { subTitle: '思考 进化 商务旗舰', themeColor: 'linear-gradient(135deg, #000000 0%, #434343 100%)' },
  'YOGA系列': { subTitle: '品质 匠心 优雅随行', themeColor: 'linear-gradient(135deg, #cc95c0 0%, #dbd4b4 100%)' },
  '拯救者系列': { subTitle: '为战而生 极致性能', themeColor: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)' },
  '小新系列': { subTitle: '年轻 就要出色', themeColor: 'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)' },
  'ThinkBook系列': { subTitle: '新青年 创造力', themeColor: 'linear-gradient(135deg, #bdc2e8 0%, #e6dee9 100%)' },
  '联想笔记本': { subTitle: '品质生活 智慧之选', themeColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }
}

// --- API 函数 ---

/**
 * 获取轮播图
 * 调用真实 API: GET /api/product/carousel
 */
export const getHomeBanners = async (): Promise<{ data: BannerItem[] }> => {
  const res = await get<CarouselApiResponse>('/api/product/carousel')
  // 只返回启用的轮播图，并按 sortOrder 排序
  const banners = res.data
    .filter(item => item.isActive === 1)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
  return { data: banners }
}

/**
 * 获取分类列表
 * 调用真实 API: GET /api/products/category/list
 */
export const getHomeCategories = async (): Promise<{ data: HomeCategory[] }> => {
  const res = await get<CategoryApiResponse>('/api/products/category/list')
  // API 返回的是嵌套结构 { status, message, data: { data: [...] } }
  const categories = res.data.data.map(cat => ({
    ...cat,
    // 如果后端没有返回 subTitle 和 themeColor，使用默认样式
    subTitle: cat.subTitle || defaultCategoryStyles[cat.name]?.subTitle || '品质之选',
    themeColor: cat.themeColor || defaultCategoryStyles[cat.name]?.themeColor || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  }))

  // 按 themeColor 中的数字拼接后进行降序排序，保证全局分类展示一致
  const extractNumeric = (color: string) => {
    const nums = String(color).match(/\d+/g)
    return nums ? parseInt(nums.join(''), 10) : 0
  }

  categories.sort((a, b) => extractNumeric(a.themeColor) - extractNumeric(b.themeColor))

  return { data: categories }
}
