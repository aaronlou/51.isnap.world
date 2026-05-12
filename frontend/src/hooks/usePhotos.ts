import { useState, useEffect, useCallback } from 'react';
import { fetchPhotos, uploadPhoto, scorePhoto, deletePhoto } from '@/api/photos';
import { fetchQuota } from '@/api/me';
import type { Photo, ScoreResult } from '@/types/photo';

export function usePhotos() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [scoringId, setScoringId] = useState<string | null>(null);
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null);
  const [showUploadNudge, setShowUploadNudge] = useState(false);

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

  // 延迟加载：由调用方（App）在切换到 gallery tab 时触发

  const handleUpload = async (file: File, isBattle = false): Promise<Photo | null> => {
    // 非 battle 上传检查配额（捐赠用户不弹窗）
    if (!isBattle) {
      try {
        const quota = await fetchQuota();
        if (!quota.is_donor && quota.uploads_today >= quota.upload_limit) {
          setShowUploadNudge(true);
        }
      } catch {
        // 静默失败，不影响上传
      }
    }

    setIsUploading(true);
    try {
      const newPhoto = await uploadPhoto(file, isBattle);
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

      if (result.accepted === false) {
        // 未达标：从本地列表移除（后端已删除文件和数据库记录）
        setPhotos(prev => prev.filter(p => p.id !== id));
      } else {
        // 达标：更新评分信息
        setPhotos(prev =>
          prev.map(p =>
            p.id === id
              ? { ...p, score: result.score, review: result.review, engine: result.engine }
              : p
          )
        );
      }
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
    setPhotos,
    isLoading,
    isUploading,
    scoringId,
    scoreResult,
    setScoreResult,
    handleUpload,
    handleScore,
    handleDelete,
    showUploadNudge,
    dismissUploadNudge: () => setShowUploadNudge(false),
    loadPhotos,
  };
}
