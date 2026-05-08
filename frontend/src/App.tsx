import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Grid3X3, BarChart3, Sparkles, Brain, Image as ImageIcon } from 'lucide-react'
import UploadZone from '@/components/UploadZone'
import ScoreReveal from '@/components/ScoreReveal'
import Leaderboard from '@/components/Leaderboard'
import PhotoGallery from '@/components/PhotoGallery'
import { usePhotos } from '@/hooks/usePhotos'
import { useLeaderboard } from '@/hooks/useLeaderboard'
import type { Tab } from '@/types/photo'

const tabs: { id: Tab; label: string; icon: typeof Camera }[] = [
  { id: 'upload', label: '上传', icon: Camera },
  { id: 'gallery', label: '画廊', icon: Grid3X3 },
  { id: 'leaderboard', label: '排行榜', icon: BarChart3 },
]

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('upload')
  const [scoredRank, setScoredRank] = useState<number | null>(null)
  const {
    photos,
    isLoading: isLoadingPhotos,
    isUploading,
    scoringId,
    scoreResult,
    setScoreResult,
    handleUpload,
    handleScore,
  } = usePhotos()

  const { leaderboard, isLoading: isLoadingLeaderboard, loadLeaderboard } = useLeaderboard()

  // When score result appears, reload leaderboard and compute rank
  useEffect(() => {
    if (scoreResult) {
      loadLeaderboard()
    }
  }, [scoreResult, loadLeaderboard])

  // When leaderboard updates after scoring, compute rank
  useEffect(() => {
    if (scoreResult && leaderboard.length > 0) {
      const idx = leaderboard.findIndex((p) => p.id === scoreResult.id)
      setScoredRank(idx >= 0 ? idx + 1 : null)
    }
  }, [leaderboard, scoreResult])

  const onUpload = async (file: File) => {
    setScoredRank(null)
    const newPhoto = await handleUpload(file)
    if (newPhoto) {
      setTimeout(() => handleScore(newPhoto.id), 400)
    }
  }

  const handleCloseScore = () => {
    setScoreResult(null)
    setScoredRank(null)
  }

  const scoredCount = photos.filter((p) => p.score !== undefined).length

  return (
    <div className="min-h-screen bg-ink-950 text-cream grain">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-ink-950/80 backdrop-blur-xl border-b border-ink-800/40">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="heading-display text-2xl text-cream tracking-tight">
              摄影大乱斗
            </span>
            <span className="text-[10px] font-medium tracking-[0.15em] uppercase text-gold-400 bg-gold-400/8 px-2 py-0.5 rounded-full">
              竞技场
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-cream-muted">
            <span className="w-1.5 h-1.5 rounded-full bg-gold-400" />
            <span>{scoredCount} 张已评分</span>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="fixed top-16 left-0 right-0 z-40 bg-ink-950/60 backdrop-blur-md border-b border-ink-800/20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all duration-300 relative
                    ${isActive ? 'text-cream' : 'text-cream-muted hover:text-cream-subtle'}
                  `}
                >
                  {isActive && (
                    <motion.div
                      layoutId="tab-indicator"
                      className="absolute bottom-0 left-0 right-0 h-px bg-gold-400"
                      transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                    />
                  )}
                  <Icon className="w-4 h-4" strokeWidth={1.5} />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-32 pb-24 max-w-5xl mx-auto px-6">
        <AnimatePresence mode="wait">
          {activeTab === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <UploadZone onUpload={onUpload} isUploading={isUploading} />
            </motion.div>
          )}

          {activeTab === 'gallery' && (
            <motion.div
              key="gallery"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <PhotoGallery
                photos={photos}
                isLoading={isLoadingPhotos}
                onScore={(id) => handleScore(id)}
                scoringId={scoringId}
              />
            </motion.div>
          )}

          {activeTab === 'leaderboard' && (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <Leaderboard photos={leaderboard} isLoading={isLoadingLeaderboard} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* AI Judging in Progress */}
      <AnimatePresence>
        {scoringId && !scoreResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-ink-950/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="bg-ink-900 border border-ink-800/80 rounded-3xl p-8 max-w-sm w-full"
            >
              <div className="text-center mb-6">
                <div className="flex justify-center gap-3 mb-4">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <ImageIcon className="w-8 h-8 text-gold-400" strokeWidth={1.5} />
                  </motion.div>
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, delay: 0.3, repeat: Infinity }}
                  >
                    <Brain className="w-8 h-8 text-cyan-400" strokeWidth={1.5} />
                  </motion.div>
                </div>
                <h3 className="text-lg font-medium text-cream mb-2">AI 评审中</h3>
                <p className="text-sm text-cream-muted">两个 AI 模型正在紧张讨论中...</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-ink-800/50 border border-ink-700/30">
                  <motion.div
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-2 h-2 rounded-full bg-gold-400 shrink-0"
                  />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-cream">VolcEngine</p>
                    <p className="text-[10px] text-cream-subtle">正在分析美学与构图...</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-ink-800/50 border border-ink-700/30">
                  <motion.div
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.5, delay: 0.5, repeat: Infinity }}
                    className="w-2 h-2 rounded-full bg-cyan-400 shrink-0"
                  />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-cream">Gemini</p>
                    <p className="text-[10px] text-cream-subtle">正在进行专业摄影点评...</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 text-center">
                <motion.div
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-[11px] text-cream-subtle"
                >
                  审议中...
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Score Reveal Modal */}
      <AnimatePresence>
        {scoreResult && (
          <ScoreReveal
            score={scoreResult.score}
            review={scoreResult.review}
            filename={photos.find((p) => p.id === scoreResult.id)?.filename ?? ''}
            engine={photos.find((p) => p.id === scoreResult.id)?.engine}
            rank={scoredRank}
            totalScored={leaderboard.length}
            onClose={handleCloseScore}
            onViewLeaderboard={() => {
              handleCloseScore()
              setActiveTab('leaderboard')
            }}
          />
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 z-30 bg-ink-950/60 backdrop-blur-md border-t border-ink-800/20">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <p className="text-[11px] text-cream-subtle tracking-wide">
            摄影大乱斗 · AI 摄影评分
          </p>
          <p className="text-[11px] text-cream-subtle">
            {photos.length} 张照片 · {scoredCount} 张已评分
          </p>
        </div>
      </footer>
    </div>
  )
}
