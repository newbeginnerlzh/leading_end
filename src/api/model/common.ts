// src/api/model/common.ts

// 后端接口统一返回结构
export interface ApiResponse<T = unknown> {
  code: number // 200 成功
  msg: string
  data: T
}

// 分页数据结构
export interface PageResult<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}
