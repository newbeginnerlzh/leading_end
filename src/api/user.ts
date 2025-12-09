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

// 可通过 env 开关快速切换 mock（开发或设置 VITE_USE_MOCK=true）
const USE_MOCK = import.meta.env.DEV || import.meta.env.VITE_USE_MOCK === 'true'

// Mock 数据（模块级，便于在本地修改并被各接口共享）
const MOCK_USER_KEY = 'mock_user'
const MOCK_ADDRESS_KEY = 'mock_address_list'

const defaultMockUser: UserInfo = {
  id: 1,
  uid: 1001,
  username: 'testuser',
  nickname: '测试用户',
  avatar: '',
  phone: '13800000000',
  email: 'testuser@example.com',
  gender: '保密',
  birthday: '1990-01-01'
}

const defaultMockAddressList: AddressListResponse = [
  {
    id: 1,
    name: '张三',
    phone: '13800000000',
    province: '北京市',
    city: '北京市',
    district: '朝阳区',
    detail: '某街道100号',
    postal_code: '100000',
    isDefault: true
  },
  {
    id: 2,
    name: '李四',
    phone: '13900000000',
    province: '上海市',
    city: '上海市',
    district: '徐汇区',
    detail: '某路200号',
    postal_code: null,
    isDefault: false
  }
]

function loadMockUser(): UserInfo {
  try {
    const raw = localStorage.getItem(MOCK_USER_KEY)
    if (raw) return JSON.parse(raw) as UserInfo
  } catch (e) {
    console.warn('loadMockUser parse error', e)
  }
  return { ...defaultMockUser }
}

function saveMockUser(user: UserInfo) {
  try {
    localStorage.setItem(MOCK_USER_KEY, JSON.stringify(user))
  } catch (e) {
    console.warn('saveMockUser error', e)
  }
}

function loadMockAddressList(): AddressListResponse {
  try {
    const raw = localStorage.getItem(MOCK_ADDRESS_KEY)
    if (raw) return JSON.parse(raw) as AddressListResponse
  } catch (e) {
    console.warn('loadMockAddressList parse error', e)
  }
  return [...defaultMockAddressList]
}

function saveMockAddressList(list: AddressListResponse) {
  try {
    localStorage.setItem(MOCK_ADDRESS_KEY, JSON.stringify(list))
  } catch (e) {
    console.warn('saveMockAddressList error', e)
  }
}

let __mockUser = loadMockUser()
let __mockAddressList = loadMockAddressList()


/**
 * 用户注册
 * @param data 注册参数
 */
export function register(data: RegisterRequest) {
  if (USE_MOCK) {
    // simulate registration -> return token + userInfo
    __mockUser = {
      ...__mockUser,
      phone: data.phone,
      // username could be same as phone for mock
      username: data.phone
    }
    saveMockUser(__mockUser)
    const mock: BaseResponse<AuthResponse> = {
      status: 200,
      message: 'ok',
      data: {
        token: 'mock-register-token',
        userInfo: __mockUser
      }
    }
    return Promise.resolve(mock)
  }
  return request.post<BaseResponse<AuthResponse>>('/user/register', data);
}

/**
 * 用户登录
 * @param data 登录参数
 */
export function login(data: LoginRequest) {
  if (USE_MOCK) {
    // simple mock: accept any account/password
    __mockUser = {
      ...__mockUser,
      username: data.account,
      phone: data.account
    }
    saveMockUser(__mockUser)
    const mock: BaseResponse<AuthResponse> = {
      status: 200,
      message: 'ok',
      data: {
        token: 'mock-login-token',
        userInfo: __mockUser
      }
    }
    return Promise.resolve(mock)
  }
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
  if (USE_MOCK) {
    const mock: BaseResponse<UserInfo> = {
      status: 200,
      message: 'ok',
      data: __mockUser
    }
    return Promise.resolve(mock)
  }
  return request.get<BaseResponse<UserInfo>>('/user/info');
}

/**
 * 更新用户信息
 * @param data 用户信息
 */
export function updateUserInfo(data: UpdateUserInfoRequest) {
  if (USE_MOCK) {
    __mockUser = {
      ...__mockUser,
      ...data
    }
    saveMockUser(__mockUser)
    const mock: BaseResponse<UserInfo> = {
      status: 200,
      message: 'ok',
      data: __mockUser
    }
    return Promise.resolve(mock)
  }
  return request.post<BaseResponse>('/user/update', data);
}

/**
 * 找回密码
 * @param data 找回密码参数
 */
export function findPassword(data: FindPasswordRequest) {
  if (USE_MOCK) {
    const mock: BaseResponse<null> = { status: 200, message: 'ok', data: null }
    return Promise.resolve(mock)
  }
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
  if (USE_MOCK) {
    const mock: BaseResponse<AddressListResponse> = { status: 200, message: 'ok', data: __mockAddressList }
    return Promise.resolve(mock)
  }
  return request.get<BaseResponse<AddressListResponse>>('/address/list');
}

/**
 * 添加地址
 * @param data 地址信息
 */
export function addAddress(data: AddressInfo) {
  if (USE_MOCK) {
    const nextId = Math.max(0, ...__mockAddressList.map(i => i.id || 0)) + 1
    const newAddr = { ...data, id: nextId }
    // if isDefault, unset others
    if (newAddr.isDefault) {
      __mockAddressList = __mockAddressList.map(a => ({ ...a, isDefault: false }))
    }
    __mockAddressList.push(newAddr)
    saveMockAddressList(__mockAddressList)
    const mock: BaseResponse<AddressInfo> = { status: 200, message: 'ok', data: newAddr }
    return Promise.resolve(mock)
  }
  return request.post<BaseResponse>('/address/add', data);
}

/**
 * 修改地址
 * @param data 地址信息
 */
export function updateAddress(data: AddressInfo) {
  if (USE_MOCK) {
    __mockAddressList = __mockAddressList.map(a => a.id === data.id ? { ...a, ...data } : a)
    // if set default, unset others
    if (data.isDefault) {
      __mockAddressList = __mockAddressList.map(a => ({ ...a, isDefault: a.id === data.id }))
    }
    const updated = __mockAddressList.find(a => a.id === data.id) as AddressInfo
    saveMockAddressList(__mockAddressList)
    const mock: BaseResponse<AddressInfo> = { status: 200, message: 'ok', data: updated }
    return Promise.resolve(mock)
  }
  return request.post<BaseResponse>('/address/update', data);
}

/**
 * 删除地址
 * @param addressId 地址ID
 */
export function deleteAddress(addressId: number) {
  if (USE_MOCK) {
    __mockAddressList = __mockAddressList.filter(a => a.id !== addressId)
    saveMockAddressList(__mockAddressList)
    const mock: BaseResponse<null> = { status: 200, message: 'ok', data: null }
    return Promise.resolve(mock)
  }
  return request.post<BaseResponse>(`/address/delete/${addressId}`);
}
