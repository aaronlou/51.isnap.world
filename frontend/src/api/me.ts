import { apiClient } from './client';

export interface MeResponse {
  id: string;
  nickname: string;
}

export interface QuotaResponse {
  uploads_today: number;
  upload_limit: number;
  mentor_messages_today: number;
  mentor_message_limit: number;
  is_donor: boolean;
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

export async function fetchQuota(): Promise<QuotaResponse> {
  const res = await apiClient.get<QuotaResponse>('/api/me/quota');
  return res.data;
}
