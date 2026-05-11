import axios from 'axios';
import { getOrCreateUserId } from '@/utils/user';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const apiClient = axios.create({
  baseURL: BASE_URL,
});

// 请求拦截器：自动附加匿名用户 ID
apiClient.interceptors.request.use((config) => {
  const userId = getOrCreateUserId();
  if (userId) {
    config.headers['X-User-ID'] = userId;
  }
  return config;
});
