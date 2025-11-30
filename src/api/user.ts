// import { get, post, put } from '@/utils/request'
import type { UserInfo, Address } from './model/userModel'

/**
 * 用户登录
 * @param data { username, password }
 * @example
 * login({ username: "admin", password: "123" })
 */
export function login(data: { username: string; password: string }) {
  void data
  // 参考实现：
  // return post<{ token: string; userInfo: UserInfo }>('/user/login', data)
  return Promise.resolve({} as { token: string; userInfo: UserInfo })
}

/**
 * 用户注册
 * @param data { username, password, phone, code }
 */
export function register(data: {
  username: string
  password: string
  phone: string
  code?: string
}) {
  void data
  // 参考实现：
  // return post('/user/register', data)
  return Promise.resolve(null)
}

/**
 * 获取当前用户信息
 * 需要 Header 携带 Token
 */
export function getUserInfo() {
  // 参考实现：
  // return get<UserInfo>('/user/info')
  return Promise.resolve({} as UserInfo)
}

/**
 * 修改用户信息
 * @param data { nickname, avatar, ... }
 */
export function updateUserInfo(data: Partial<UserInfo>) {
  void data
  // 参考实现：
  // return put('/user/info', data)
  return Promise.resolve(null)
}

/**
 * 获取收货地址列表
 */
export function getAddressList() {
  // 参考实现：
  // return get<Address[]>('/user/address/list')
  return Promise.resolve([] as Address[])
}

/**
 * 保存收货地址（新增或修改）
 * @param data Address 对象，有 id 则为修改，无 id 为新增
 */
export function saveAddress(data: Partial<Address>) {
  void data
  // 参考实现：
  // return post('/user/address/save', data)
  return Promise.resolve(null)
}

/**
 * 删除收货地址
 * @param id 地址ID
 */
export function deleteAddress(id: number) {
  void id
  // 参考实现：
  // return post(`/user/address/delete/${id}`)
  return Promise.resolve(null)
}
