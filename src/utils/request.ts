// src/utils/request.ts
import axios, { type AxiosResponse } from 'axios';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useRouter } from 'vue-router';

// 创建Axios实例
const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api', // 环境变量配置接口前缀
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器：添加Token
service.interceptors.request.use(
  (config) => {
    // 从localStorage获取Token
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('请求错误:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器：统一处理响应
service.interceptors.response.use(
  (response: AxiosResponse) => {
    const res = response.data;

    // 业务状态码非200时，提示错误
    if (res.status !== 200) {
      ElMessage.error(res.message || '请求失败');
      return Promise.reject(res);
    }

    return res;
  },
  (error) => {
    console.error('响应错误:', error);

    // Token过期处理
    if (error.response?.status === 401) {
      ElMessageBox.confirm(
        '登录状态已过期，请重新登录',
        '提示',
        {
          confirmButtonText: '重新登录',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        // 清除Token并跳转到登录页
        localStorage.removeItem('token');
        const router = useRouter();
        router.push('/login');
      });
    }

    ElMessage.error(error.message || '服务器错误');
    return Promise.reject(error);
  }
);


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
