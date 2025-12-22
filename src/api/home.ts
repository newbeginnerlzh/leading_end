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
  id: number
  name: string
  subTitle: string
  themeColor: string
}

// --- 模拟数据 (Mock Data) ---

// 1. 模拟轮播图数据
const mockBanners: BannerItem[] = [
  { id: 1, imgUrl: 'https://p1.lefile.cn/fes/cms/2025/11/14/fqcf0ucoygm6564p5q2h2p3h2ri1l0795845.jpg' },
  { id: 2, imgUrl: 'https://p1.lefile.cn/fes/cms/2025/12/08/amnrpzizrr95itmwgjjc8bbbvn4f2j126568.jpg' },
  { id: 3, imgUrl: 'https://p4.lefile.cn/fes/cms/2025/11/26/clgl9znq9m6e8clobxpx0drrljj2ku877590.jpg' }
]

// 2. 模拟分类/楼层配置数据 (ID 与你的数据库保持一致)
const mockCategories: HomeCategory[] = [
  { 
    id: 29, 
    name: 'ThinkPad系列', 
    subTitle: '思考 进化', 
    themeColor: 'linear-gradient(135deg, #000000 0%, #434343 100%)' 
  },
  { 
    id: 27, 
    name: 'YOGA系列', 
    subTitle: '品质 匠心', 
    themeColor: 'linear-gradient(135deg, #cc95c0 0%, #dbd4b4 100%)' 
  },
  { 
    id: 25, 
    name: '拯救者系列', 
    subTitle: '为战而生', 
    themeColor: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)' 
  },
  { 
    id: 26, 
    name: '小新系列', 
    subTitle: '年轻 就要出色', 
    themeColor: 'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)' 
  },
  { 
    id: 28, 
    name: 'ThinkBook系列', 
    subTitle: '新青年 创造力', 
    themeColor: 'linear-gradient(135deg, #bdc2e8 0%, #e6dee9 100%)' 
  }
]

// --- 模拟 API 函数 ---

// 模拟获取轮播图
export const getHomeBanners = async () => {
  return new Promise<{ data: BannerItem[] }>((resolve) => {
    // 模拟网络延迟 300ms
    setTimeout(() => {
      resolve({ data: mockBanners })
    }, 300)
  })
}

// 模拟获取分类配置
export const getHomeCategories = async () => {
  return new Promise<{ data: HomeCategory[] }>((resolve) => {
    setTimeout(() => {
      resolve({ data: mockCategories })
    }, 300)
  })
}