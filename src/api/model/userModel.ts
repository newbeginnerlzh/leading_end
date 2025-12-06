// src/api/model/userModel.ts
/**
 * 用户注册请求参数
 */
export interface RegisterRequest {
  phone: string;
  password: string;
  code: string;
  agreeProtocol: boolean;
}

/**
 * 用户登录请求参数
 */
export interface LoginRequest {
  account: string;
  password: string;
}

/**
 * 通用响应格式
 */
export interface BaseResponse<T = unknown> {
  status: number | string;
  message: string;
  data: T;
}

/**
 * 用户信息
 */
export interface UserInfo {
  id?: number;
  uid?: number;
  username?: string;
  nickname?: string;
  avatar?: string;
  phone?: string;
  email?: string;
  gender?: string;
  birthday?: string;
}

/**
 * 登录/注册响应数据
 */
export interface AuthResponse {
  token: string;
  userInfo: UserInfo;
}

/**
 * 找回密码请求参数
 */
export interface FindPasswordRequest {
  phone: string;
  code: string;
  newPassword: string;
}

/**
 * 注销账号请求参数
 */
export interface CancelAccountRequest {
  password: string;
}

/**
 * 修改密码请求参数
 */
export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

/**
 * 更新用户信息请求参数
 */
export interface UpdateUserInfoRequest {
  avatar?: string;
  birthday?: string;
  gender?: string;
}

/**
 * 地址信息
 */
export interface AddressInfo {
  id?: number;
  name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  detail: string;
  postal_code?: string | null;
  isDefault: boolean;
}

/**
 * 地址列表响应
 */
export type AddressListResponse = AddressInfo[];
