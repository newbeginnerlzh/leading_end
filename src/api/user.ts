// src/api/user.ts
import request from '@/utils/request';
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

type ApiResult<T = unknown> = Promise<BaseResponse<T>>;
const asApiResult = <T>(promise: unknown) => promise as unknown as ApiResult<T>;

/**
 * 用户注册
 * @param data 注册参数
 */
export function register(data: RegisterRequest) {
  return asApiResult<AuthResponse>(request.post<BaseResponse<AuthResponse>>('/api/auth/register', data));
}

/**
 * 用户登录
 * @param data 登录参数
 */
export function login(data: LoginRequest) {
  return asApiResult<AuthResponse>(request.post<BaseResponse<AuthResponse>>('/api/auth/login', data));
}

/**
 * 退出登录
 */
export function logout() {
  return asApiResult(request.post<BaseResponse>('/api/user/signout'));
}

/**
 * 获取用户信息
 */
export function getUserInfo() {
  return asApiResult<UserInfo>(request.get<BaseResponse<UserInfo>>('/api/user/info'));
}

/**
 * 更新用户信息
 * @param data 用户信息
 */
export function updateUserInfo(data: UpdateUserInfoRequest) {
  return asApiResult(request.put<BaseResponse>('/api/user/update', data));
}

/**
 * 找回密码
 * @param data 找回密码参数
 */
export function findPassword(data: FindPasswordRequest) {
  return asApiResult(request.post<BaseResponse>('/api/auth/reset-password', data));
}

/**
 * 注销账号
 * @param data 注销参数
 */
export function cancelAccount(data: CancelAccountRequest) {
  // DELETE with body
  return asApiResult(request.delete<BaseResponse>('/api/auth/delete-account', { data }));
}

/**
 * 修改密码
 * @param data 修改密码参数
 */
export function changePassword(data: ChangePasswordRequest) {
  return asApiResult(request.put<BaseResponse>('/api/user/change-password', data));
}

/**
 * 获取地址列表
 */
export function getAddressList() {
  return asApiResult<AddressListResponse>(request.get<BaseResponse<AddressListResponse>>('/api/address/list'));
}

/**
 * 添加地址
 * @param data 地址信息
 */
export function addAddress(data: AddressInfo) {
  return asApiResult(request.post<BaseResponse>('/api/address/add', data));
}

/**
 * 修改地址
 * @param data 地址信息
 */
export function updateAddress(data: AddressInfo) {
  return asApiResult(request.put<BaseResponse>('/api/address/update', data));
}

/**
 * 删除地址
 * @param addressId 地址ID
 */
export function deleteAddress(addressId: number) {
  return asApiResult(request.delete<BaseResponse>(`/api/address/delete/${addressId}`));
}

/**
 * 上传用户头像
 * @param file 头像文件
 * @returns 返回图片访问URL
 */
export function uploadAvatar(file: File) {
  const formData = new FormData();
  formData.append('avatar', file);
  return asApiResult<string>(request.post<BaseResponse<string>>('/api/user/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }));
}
