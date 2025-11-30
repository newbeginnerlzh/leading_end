// src/api/product.ts
// import { get } from '@/utils/request'
import type { ProductSimple, ProductDetail } from './model/productModel'
import type { PageResult } from './model/common'

/**
 * 获取商品列表（搜索、筛选）
 * @param params { keyword, categoryId, page, pageSize, sort }
 * @example
 * getProductList({ keyword: "Y9000P", page: 1, pageSize: 20 })
 */
export function getProductList(params: {
  keyword?: string
  categoryId?: number
  page?: number
  pageSize?: number
  sort?: string
}) {
  void params
  // 参考实现：
  // return get<PageResult<ProductSimple>>('/product/list', params)
  return Promise.resolve({
    list: [],
    total: 0,
    page: params.page || 1,
    pageSize: params.pageSize || 10,
  } as PageResult<ProductSimple>)
}

/**
 * 获取商品详情
 * 包含详细参数 ComputerParams
 * @param id 商品ID
 * @example
 * getProductDetail(1001) -> 返回包含 skus, params 的完整信息
 */
export function getProductDetail(id: number) {
  void id
  // 参考实现：
  // return get<ProductDetail>(`/product/detail/${id}`)
  return Promise.resolve({} as ProductDetail)
}

/**
 * 获取商品分类树
 * @example
 * 返回: [{ id: 1, name: "笔记本", children: [...] }]
 */
export function getCategoryList() {
  // 参考实现：
  // return get<any[]>('/product/category/list')
  return Promise.resolve([] as unknown[])
}
