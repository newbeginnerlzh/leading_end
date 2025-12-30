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
  link?: string
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

// --- 模拟数据 (Mock Data) ---

// 1. 模拟轮播图数据
const mockBanners: BannerItem[] = [
  { id: 1, imgUrl: 'https://p1.lefile.cn/fes/cms/2025/11/14/fqcf0ucoygm6564p5q2h2p3h2ri1l0795845.jpg' },
  { id: 2, imgUrl: 'https://p1.lefile.cn/fes/cms/2025/12/08/amnrpzizrr95itmwgjjc8bbbvn4f2j126568.jpg' },
  { id: 3, imgUrl: 'https://p4.lefile.cn/fes/cms/2025/11/26/clgl9znq9m6e8clobxpx0drrljj2ku877590.jpg' }
]

// 默认分类样式配置
const defaultCategoryStyles: Record<string, { subTitle: string; themeColor: string }> = {
  'ThinkPad系列': { subTitle: '思考 进化 商务旗舰', themeColor: 'linear-gradient(135deg, #000000 0%, #434343 100%)' },
  'YOGA系列': { subTitle: '品质 匠心 优雅随行', themeColor: 'linear-gradient(135deg, #cc95c0 0%, #dbd4b4 100%)' },
  '拯救者系列': { subTitle: '为战而生 极致性能', themeColor: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)' },
  '小新系列': { subTitle: '年轻 就要出色', themeColor: 'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)' },
  'ThinkBook系列': { subTitle: '新青年 创造力', themeColor: 'linear-gradient(135deg, #bdc2e8 0%, #e6dee9 100%)' },
  '联想笔记本': { subTitle: '品质生活 智慧之选', themeColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  '扬音系列': { subTitle: '声临其境', themeColor: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  '来酷系列': { subTitle: '潮流科技', themeColor: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }
}

// --- API 函数 ---

// 模拟获取轮播图（暂时保留模拟数据）
export const getHomeBanners = async () => {
  return new Promise<{ data: BannerItem[] }>((resolve) => {
    // 模拟网络延迟 300ms
    setTimeout(() => {
      resolve({ data: mockBanners })
    }, 300)
  })
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
  return { data: categories }
}