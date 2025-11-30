import axios, { type AxiosInstance, type AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'
import type { ApiResponse } from '@/api/model/common'

// 1. 创建 axios 实例
const service: AxiosInstance = axios.create({
  // 这里填后端的地址。如果后端还没好，先随便填，或者填 '/api' 配合代理
  // 等后端好了，只需要改这一行
  baseURL: 'http://localhost:8080/api',
  timeout: 10000, // 请求超时时间
})

// 2. 请求拦截器：每次发请求前自动执行
service.interceptors.request.use(
  (config) => {
    // 从 LocalStorage 获取 Token
    const token = localStorage.getItem('token')
    if (token) {
      // 如果有 token，把它加到请求头里发给后端
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// 3. 响应拦截器：后端回消息后自动执行
service.interceptors.response.use(
  (response) => {
    const res = response.data as ApiResponse
    // 假设后端返回格式是：{ code: 200, data: {...}, msg: '成功' }
    if (res.code !== 200) {
      // 如果 code 不是 200，说明业务出错（比如密码错误），弹窗提示
      ElMessage.error(res.msg || '系统错误')
      return Promise.reject(new Error(res.msg || 'Error'))
    } else {
      return res.data as unknown as AxiosResponse
    }
  },
  (error) => {
    // 处理网络错误（比如 404, 500）
    ElMessage.error(error.message || '网络异常')
    return Promise.reject(error)
  },
)

// 通用 GET 请求
export function get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  return service.get(url, { params }) as Promise<T>
}

// 通用 POST 请求
export function post<T>(url: string, data?: Record<string, unknown> | unknown[]): Promise<T> {
  return service.post(url, data) as Promise<T>
}

// 通用 PUT 请求
export function put<T>(url: string, data?: Record<string, unknown> | unknown[]): Promise<T> {
  return service.put(url, data) as Promise<T>
}

// 通用 DELETE 请求
export function del<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  return service.delete(url, { params }) as Promise<T>
}

export default service
