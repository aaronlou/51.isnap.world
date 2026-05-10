import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Swords,
  Loader2,
  ImageOff,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Camera,
  Shield,
  Sparkles,
} from 'lucide-react'
import type { Photo } from '@/types/photo'
import type { UnsplashPhoto } from '@/types/unsplash'
import { fetchRandomUnsplash } from '@/api/unsplash'

interface BattleArenaProps {
  photos: Photo[]
  isLoading: boolean
  onLoadPhotos: () => void
  onBattle: (id: string) => void
  isBattling: boolean
  battlingId: string | null
}

const CHANGES_KEY = 'battle_opponent_changes_left'
const MAX_CHANGES = 3

function getChangesLeft(): number {
  const raw = localStorage.getItem(CHANGES_KEY)
  if (raw === null) return MAX_CHANGES
  const n = parseInt(raw, 10)
  return isNaN(n) ? MAX_CHANGES : n
}

function setChangesLeft(n: number) {
  localStorage.setItem(CHANGES_KEY, String(n))
}

export default function BattleArena({
  photos,
  isLoading,
  onLoadPhotos,
  onBattle,
  isBattling,
  battlingId,
}: BattleArenaProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [opponent, setOpponent] = useState<UnsplashPhoto | null>(null)
  const [changesLeft, setChangesLeftState] = useState(getChangesLeft)
  const [isLoadingOpponent, setIsLoadingOpponent] = useState(false)
  const [opponentError, setOpponentError] = useState<string | null>(null)

  const selectedPhoto = photos[selectedIndex] ?? null

  // 自动加载对手
  const loadOpponent = useCallback(async () => {
    setIsLoadingOpponent(true)
    setOpponentError(null)
    try {
      const photo = await fetchRandomUnsplash()
      setOpponent(photo)
    } catch (err: any) {
      console.error('Failed to load opponent:', err)
      setOpponentError('加载对手失败，请重试')
    } finally {
      setIsLoadingOpponent(false)
    }
  }, [])

  // 组件挂载时，如果无对手则自动加载
  useEffect(() => {
    if (!opponent && !isLoadingOpponent && photos.length > 0) {
      loadOpponent()
    }
  }, [opponent, isLoadingOpponent, photos.length, loadOpponent])

  // 切换照片时保持 selectedIndex 在有效范围
  useEffect(() => {
    if (selectedIndex >= photos.length && photos.length > 0) {
      setSelectedIndex(0)
    }
  }, [photos.length, selectedIndex])

  const handleChangeOpponent = async () => {
    if (changesLeft <= 0) return
    const newLeft = changesLeft - 1
    setChangesLeftState(newLeft)
    setChangesLeft(newLeft)
    await loadOpponent()
  }

  const handlePrevPhoto = () => {
    if (photos.length <= 1) return
    setSelectedIndex((i) => (i - 1 + photos.length) % photos.length)
  }

  const handleNextPhoto = () => {
    if (photos.length <= 1) return
    setSelectedIndex((i) => (i + 1) % photos.length)
  }

  const canBattle = selectedPhoto != null && opponent != null && !isBattling

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 text-cream-muted animate-spin" strokeWidth={1.5} />
      </div>
    )
  }

  // 没有照片：引导上传
  if (photos.length === 0) {
    return (
      <div className="text-center py-24">
        <div className="w-16 h-16 rounded-full bg-ink-900 border border-ink-800 flex items-center justify-center mx-auto mb-5">
          <Camera className="w-6 h-6 text-cream-subtle" strokeWidth={1.5} />
        </div>
        <h3 className="text-lg font-medium text-cream mb-2">还没有作品</h3>
        <p className="text-cream-muted text-sm mb-6">先去上传一张照片，再来挑战随机大师</p>
        <button
          onClick={() => {
            // 触发父组件切换到 upload tab
            const uploadBtn = document.querySelector('[data-tab="upload"]') as HTMLElement
            uploadBtn?.click()
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold-400 text-ink-950 text-sm font-medium hover:bg-gold-300 transition-colors"
        >
          <Camera className="w-4 h-4" strokeWidth={1.5} />
          去上传
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Swords className="w-4 h-4 text-gold-400" strokeWidth={1.5} />
          <p className="label">摄影大乱斗</p>
        </div>
        <h2 className="heading-display text-4xl md:text-5xl text-cream mb-3">
          挑战随机大师
        </h2>
        <p className="text-cream-muted text-sm max-w-md mx-auto">
          选择你的作品，与 Unsplash 专业摄影师一决高下
        </p>
      </div>

      {/* VS Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Left: User Photo */}
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-gold-400" />
            <span className="text-[11px] font-medium tracking-[0.15em] uppercase text-cream-muted">
              你的作品
            </span>
            <span className="text-[10px] text-cream-subtle ml-auto">
              {selectedIndex + 1} / {photos.length}
            </span>
          </div>

          <div className="relative rounded-2xl overflow-hidden bg-ink-900 border border-ink-800/60">
            {/* Photo */}
            <div className="aspect-[4/3] relative">
              <AnimatePresence mode="wait">
                <motion.img
                  key={selectedPhoto.id}
                  src={selectedPhoto.url}
                  alt={selectedPhoto.filename}
                  className="w-full h-full object-cover"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                />
              </AnimatePresence>

              {/* Nav arrows */}
              {photos.length > 1 && (
                <>
                  <button
                    onClick={handlePrevPhoto}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-ink-950/60 backdrop-blur-sm flex items-center justify-center text-cream-muted hover:text-cream transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
                  </button>
                  <button
                    onClick={handleNextPhoto}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-ink-950/60 backdrop-blur-sm flex items-center justify-center text-cream-muted hover:text-cream transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
                  </button>
                </>
              )}

              {/* Score badge */}
              {selectedPhoto.score != null && (
                <div className="absolute top-3 right-3 flex items-center gap-1 bg-ink-950/70 backdrop-blur-sm rounded-full px-2.5 py-1">
                  <Sparkles className="w-3 h-3 text-gold-400" strokeWidth={1.5} />
                  <span className="text-xs font-bold text-cream">{selectedPhoto.score.toFixed(1)}</span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="p-4">
              <p className="text-sm text-cream font-medium truncate">{selectedPhoto.filename}</p>
              {selectedPhoto.review && (
                <p className="text-[11px] text-cream-subtle mt-1 line-clamp-2">{selectedPhoto.review}</p>
              )}
            </div>
          </div>
        </div>

        {/* Right: Opponent Photo */}
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span className="text-[11px] font-medium tracking-[0.15em] uppercase text-cream-muted">
              随机对手
            </span>
            <span className="text-[10px] text-cream-subtle ml-auto flex items-center gap-1">
              <Shield className="w-3 h-3" strokeWidth={1.5} />
              剩余 {changesLeft} 次更换
            </span>
          </div>

          <div className="relative rounded-2xl overflow-hidden bg-ink-900 border border-ink-800/60">
            {isLoadingOpponent ? (
              <div className="aspect-[4/3] flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-cream-muted animate-spin" strokeWidth={1.5} />
              </div>
            ) : opponent ? (
              <>
                <div className="aspect-[4/3] relative">
                  <img
                    src={opponent.url}
                    alt={opponent.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <p className="text-sm text-cream font-medium truncate">{opponent.title}</p>
                  <a
                    href={opponent.photographer_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-cream-subtle hover:text-gold-400 transition-colors mt-1 inline-block"
                  >
                    摄影：{opponent.photographer} · Unsplash
                  </a>
                </div>
              </>
            ) : (
              <div className="aspect-[4/3] flex flex-col items-center justify-center text-center p-6">
                <ImageOff className="w-8 h-8 text-cream-subtle mb-3" strokeWidth={1.5} />
                <p className="text-sm text-cream-muted mb-2">尚未选择对手</p>
                <button
                  onClick={loadOpponent}
                  className="text-xs text-gold-400 hover:text-gold-300 transition-colors"
                >
                  加载对手
                </button>
              </div>
            )}

            {/* Change opponent button */}
            {opponent && (
              <button
                onClick={handleChangeOpponent}
                disabled={changesLeft <= 0 || isLoadingOpponent}
                className="absolute top-3 right-3 flex items-center gap-1.5 bg-ink-950/70 backdrop-blur-sm rounded-full px-3 py-1.5 text-[10px] text-cream-muted hover:text-gold-400 transition-colors disabled:opacity-40 disabled:hover:text-cream-muted"
              >
                <RefreshCw className={`w-3 h-3 ${isLoadingOpponent ? 'animate-spin' : ''}`} strokeWidth={1.5} />
                {changesLeft <= 0 ? '次数已用完' : '更换对手'}
              </button>
            )}
          </div>

          {opponentError && (
            <p className="text-[11px] text-red-400 mt-2 text-center">{opponentError}</p>
          )}
        </div>
      </div>

      {/* VS Badge */}
      <div className="flex items-center justify-center mb-8">
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-ink-800 border border-ink-700 flex items-center justify-center">
            <Swords className="w-5 h-5 text-gold-400" strokeWidth={1.5} />
          </div>
          {battlingId === selectedPhoto?.id && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-gold-400 flex items-center justify-center">
              <Loader2 className="w-2.5 h-2.5 text-ink-950 animate-spin" strokeWidth={2} />
            </div>
          )}
        </div>
      </div>

      {/* Battle Button */}
      <div className="text-center">
        <button
          onClick={() => selectedPhoto && onBattle(selectedPhoto.id)}
          disabled={!canBattle}
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gold-400 text-ink-950 text-sm font-bold tracking-wide hover:bg-gold-300 transition-colors disabled:opacity-40 disabled:hover:bg-gold-400 disabled:cursor-not-allowed"
        >
          {isBattling ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />
              AI 评审中...
            </>
          ) : (
            <>
              <Swords className="w-4 h-4" strokeWidth={1.5} />
              发起挑战
            </>
          )}
        </button>
        {!canBattle && !isBattling && (
          <p className="text-[11px] text-cream-subtle mt-2">
            {!selectedPhoto
              ? '请先选择一张照片'
              : !opponent
              ? '正在加载对手...'
              : ''}
          </p>
        )}
      </div>
    </div>
  )
}
