import { apiClient } from './client';
import type { Photo, ScoreResult, BattleResult, BattleOpponent } from '@/types/photo';

export async function fetchPhotos(): Promise<Photo[]> {
  const res = await apiClient.get<Photo[]>('/api/photos');
  return res.data;
}

export async function fetchLeaderboard(): Promise<Photo[]> {
  const res = await apiClient.get<Photo[]>('/api/leaderboard');
  return res.data;
}

export async function uploadPhoto(file: File, isBattle = false): Promise<Photo> {
  const formData = new FormData();
  formData.append('file', file);
  if (isBattle) {
    formData.append('is_battle', '1');
  }
  const res = await apiClient.post<Photo>('/api/upload', formData);
  return res.data;
}

export async function scorePhoto(id: string): Promise<ScoreResult> {
  const res = await apiClient.post<ScoreResult>(`/api/photos/${id}/score`);
  return res.data;
}

export async function deletePhoto(id: string): Promise<Photo> {
  const res = await apiClient.delete<Photo>(`/api/photos/${id}`);
  return res.data;
}

export async function battlePhoto(id: string, opponent?: BattleOpponent): Promise<BattleResult> {
  const res = await apiClient.post<BattleResult>(`/api/photos/${id}/battle`, opponent);
  return res.data;
}
