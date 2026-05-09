import { apiClient } from './client';

export interface DonationRequest {
  amount: number; // 单位：分
  currency: 'gbp' | 'usd';
}

export interface DonationResponse {
  url: string;
}

export async function createCheckoutSession(
  amount: number,
  currency: 'gbp' | 'usd' = 'gbp'
): Promise<DonationResponse> {
  const res = await apiClient.post<DonationResponse>('/api/donate', { amount, currency });
  return res.data;
}
