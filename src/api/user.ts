// src/api/user.ts
import request from '@/utils/request'; // 需先创建请求工具类
import type {
  RegisterRequest,
  LoginRequest,
  BaseResponse,
  AuthResponse,
  UserInfo,
  FindPasswordRequest,
  CancelAccountRequest,
  ChangePasswordRequest,
  UpdateUserInfoRequest,
  AddressInfo,
  AddressListResponse
} from './model/userModel';

/**
 * 用户注册
 * @param data 注册参数
 */
export function register(data: RegisterRequest) {
  return request.post<BaseResponse<AuthResponse>>('/user/register', data);
}

/**
 * 用户登录
 * @param data 登录参数
 */
export function login(data: LoginRequest) {
  return request.post<BaseResponse<AuthResponse>>('/user/login', data);
}

/**
 * 退出登录
 */
export function logout() {
  return request.post<BaseResponse>('/user/logout');
}

/**
 * 获取用户信息
 */
export function getUserInfo() {
  return request.get<BaseResponse<UserInfo>>('/user/info');
}

/**
 * 更新用户信息
 * @param data 用户信息
 */
export function updateUserInfo(data: UpdateUserInfoRequest) {
  return request.post<BaseResponse>('/user/update', data);
}

/**
 * 找回密码
 * @param data 找回密码参数
 */
export function findPassword(data: FindPasswordRequest) {
  return request.post<BaseResponse>('/user/find-password', data);
}

/**
 * 注销账号
 * @param data 注销参数
 */
export function cancelAccount(data: CancelAccountRequest) {
  return request.post<BaseResponse>('/user/cancel', data);
}

/**
 * 修改密码
 * @param data 修改密码参数
 */
export function changePassword(data: ChangePasswordRequest) {
  return request.post<BaseResponse>('/user/change-password', data);
}

/**
 * 获取地址列表
 */
export function getAddressList() {
  return request.get<BaseResponse<AddressListResponse>>('/address/list');
}

/**
 * 添加地址
 * @param data 地址信息
 */
export function addAddress(data: AddressInfo) {
  return request.post<BaseResponse>('/address/add', data);
}

/**
 * 修改地址
 * @param data 地址信息
 */
export function updateAddress(data: AddressInfo) {
  return request.post<BaseResponse>('/address/update', data);
}

/**
 * 删除地址
 * @param addressId 地址ID
 */
export function deleteAddress(addressId: number) {
  return request.post<BaseResponse>(`/address/delete/${addressId}`);
}
