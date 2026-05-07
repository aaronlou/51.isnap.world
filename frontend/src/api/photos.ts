import { apiClient } from './client';
import type { Photo, ScoreResult } from '@/types/photo';

export async function fetchPhotos(): Promise<Photo[]> {
  const res = await apiClient.get<Photo[]>('/api/photos');
  return res.data;
}

export async function fetchLeaderboard(): Promise<Photo[]> {
  const res = await apiClient.get<Photo[]>('/api/leaderboard');
  return res.data;
}

export async function uploadPhoto(file: File): Promise<Photo> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await apiClient.post<Photo>('/api/upload', formData, {
    headers: {
      'Content-Type': undefined, // 让浏览器自动生成 multipart/form-data; boundary=...
    },
  });
  return res.data;
}

export async function scorePhoto(id: string): Promise<ScoreResult> {
  const res = await apiClient.post<ScoreResult>(`/api/photos/${id}/score`);
  return res.data;
}
