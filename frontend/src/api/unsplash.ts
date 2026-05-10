import { apiClient } from './client';
import type { UnsplashPhoto } from '@/types/unsplash';

export async function fetchRandomUnsplash(): Promise<UnsplashPhoto> {
  const res = await apiClient.get<UnsplashPhoto>('/api/unsplash/random');
  return res.data;
}
