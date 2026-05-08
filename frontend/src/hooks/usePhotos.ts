import { useState, useEffect, useCallback } from 'react';
import { fetchPhotos, uploadPhoto, scorePhoto, deletePhoto } from '@/api/photos';
import type { Photo, ScoreResult } from '@/types/photo';

export function usePhotos() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [scoringId, setScoringId] = useState<string | null>(null);
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null);

  const loadPhotos = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchPhotos();
      setPhotos(data);
    } catch (err) {
      console.error('Failed to fetch photos:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  const handleUpload = async (file: File): Promise<Photo | null> => {
    setIsUploading(true);
    try {
      const newPhoto = await uploadPhoto(file);
      setPhotos(prev => [newPhoto, ...prev]);
      return newPhoto;
    } catch (err: any) {
      console.error('Upload failed:', err);
      alert(err.response?.data || '上传失败');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleScore = async (id: string): Promise<ScoreResult | null> => {
    setScoringId(id);
    try {
      const result = await scorePhoto(id);
      setScoreResult({ ...result, id });

      setPhotos(prev =>
        prev.map(p =>
          p.id === id
            ? { ...p, score: result.score, review: result.review, engine: result.engine }
            : p
        )
      );
      return result;
    } catch (err: any) {
      console.error('Scoring failed:', err);
      alert(err.response?.data || '评分失败');
      return null;
    } finally {
      setScoringId(null);
    }
  };

  const handleDelete = async (id: string): Promise<boolean> => {
    if (!confirm('确定要删除这张照片吗？')) return false;
    try {
      await deletePhoto(id);
      setPhotos(prev => prev.filter(p => p.id !== id));
      return true;
    } catch (err: any) {
      console.error('Delete failed:', err);
      alert(err.response?.data?.error || '删除失败');
      return false;
    }
  };

  return {
    photos,
    isLoading,
    isUploading,
    scoringId,
    scoreResult,
    setScoreResult,
    handleUpload,
    handleScore,
    handleDelete,
  };
}
