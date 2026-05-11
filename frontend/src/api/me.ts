import { apiClient } from './client';

export interface MeResponse {
  id: string;
  nickname: string;
}

export async function fetchMe(): Promise<MeResponse | null> {
  try {
    const res = await apiClient.get<MeResponse>('/api/me');
    return res.data;
  } catch (err: any) {
    if (err.response?.status === 404 || err.response?.data?.error) {
      return null;
    }
    throw err;
  }
}

export async function updateNickname(nickname: string): Promise<{ nickname: string }> {
  const res = await apiClient.patch<{ nickname: string }>('/api/me', { nickname });
  return res.data;
}
