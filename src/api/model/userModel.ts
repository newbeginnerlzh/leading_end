// src/api/model/userModel.ts
export interface UserInfo {
  id: number
  nickname: string
  avatar: string
  phone: string
}

export interface Address {
  id: number
  name: string
  phone: string
  region: string // 省市区 "广东省 深圳市 南山区"
  detail: string // 详细地址
  isDefault: boolean
}
