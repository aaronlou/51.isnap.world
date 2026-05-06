import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Swords,
  Upload,
  Trophy,
  Images,
  Zap,
  Sparkles,
} from 'lucide-react'
import UploadZone from '@/components/UploadZone'
import ScoreReveal from '@/components/ScoreReveal'
import Leaderboard from '@/components/Leaderboard'
import PhotoGallery from '@/components/PhotoGallery'
import { usePhotos } from '@/hooks/usePhotos'
import { useLeaderboard } from '@/hooks/useLeaderboard'
import type { Tab } from '@/types/photo'

function ArenaBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Dark arena floor gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-arena-900 via-arena-800 to-arena-900" />

      {/* Center spotlight */}
      <motion.div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px]"
        animate={{ opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="w-full h-full rounded-full bg-gradient-radial from-gold-500/8 via-transparent to-transparent" />
      </motion.div>

      {/* Arena ring glow */}
      <motion.div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px]"
        animate={{ opacity: [0.15, 0.25, 0.15] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="w-full h-full rounded-[50%] bg-gradient-to-t from-gold-500/10 via-gold-500/5 to-transparent" />
      </motion.div>

      {/* VS decorative elements */}
      <div className="absolute top-1/3 left-6 text-7xl font-display text-gold-500/5 select-none">
        VS
      </div>
      <div className="absolute bottom-1/3 right-6 text-7xl font-display text-gold-500/5 select-none rotate-180">
        VS
      </div>

      {/* Floating particles */}
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background:
              i % 3 === 0
                ? 'rgba(229, 166, 35, 0.4)'
                : i % 3 === 1
                  ? 'rgba(255, 46, 99, 0.3)'
                  : 'rgba(0, 217, 255, 0.2)',
            boxShadow:
              i % 3 === 0
                ? '0 0 6px rgba(229, 166, 35, 0.3)'
                : '0 0 4px rgba(255, 46, 99, 0.2)',
          }}
          animate={{
            y: [0, -20 - Math.random() * 40, 0],
            opacity: [0, 0.6, 0],
          }}
          transition={{
            duration: 3 + Math.random() * 4,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

const tabs: { id: Tab; label: string; icon: typeof Swords }[] = [
  { id: 'upload', label: '挑战评审', icon: Swords },
  { id: 'gallery', label: '参赛作品', icon: Images },
  { id: 'leaderboard', label: '冠军榜单', icon: Trophy },
]

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('upload')
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

  useEffect(() => {
    if (scoreResult) {
      loadLeaderboard()
    }
  }, [scoreResult, loadLeaderboard])

  const onUpload = async (file: File) => {
    const newPhoto = await handleUpload(file)
    if (newPhoto) {
      setTimeout(() => {
        handleScore(newPhoto.id)
      }, 500)
    }
  }

  const scoredCount = photos.filter((p) => p.score !== undefined).length

  return (
    <div className="min-h-screen bg-arena-900 relative overflow-hidden">
      <ArenaBackground />

      {/* Header */}
      <header className="relative z-20 border-b border-gold-500/10 bg-arena-900/80 backdrop-blur-xl sticky top-0">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4"
          >
            <div className="relative">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-gold-500 to-neon-red flex items-center justify-center shadow-lg shadow-gold-500/30">
                <Swords className="w-5 h-5 text-white" />
              </div>
              <motion.div
                className="absolute -inset-1 rounded-xl border border-gold-500/30"
                animate={{ rotate: 360, opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-display tracking-wider text-white leading-none">
                  PHOTO BATTLE
                </h1>
                <span className="text-xs font-bold text-neon-red bg-neon-red/10 border border-neon-red/20 rounded px-1.5 py-0.5">
                  ARENA
                </span>
              </div>
              <p className="text-xs text-arena-400 font-medium">
                AI 评审团 · 五一特辑
              </p>
            </div>
          </motion.div>

          {/* Stats */}
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="hidden md:flex items-center gap-2 bg-gold-500/5 border border-gold-500/15 rounded-full px-3 py-1.5"
            >
              <Zap className="w-3.5 h-3.5 text-gold-400" />
              <span className="text-xs text-gold-400/80 font-medium">
                已评审 {scoredCount} 张
              </span>
            </motion.div>
          </div>
        </div>
      </header>

      {/* Tab Navigation - styled as arena modes */}
      <nav className="relative z-20 max-w-md mx-auto px-4 mt-6">
        <div className="flex bg-arena-800/90 rounded-full p-1 border border-gold-500/10 shadow-lg shadow-black/30">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-full text-sm font-medium transition-all duration-300 relative overflow-hidden
                  ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-gold-500 to-gold-600 text-arena-900 shadow-lg shadow-gold-500/30'
                      : 'text-arena-400 hover:text-arena-200 hover:bg-arena-700/50'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-20 max-w-6xl mx-auto px-4 py-8 pb-24">
        <AnimatePresence mode="wait">
          {activeTab === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              <UploadZone onUpload={onUpload} isUploading={isUploading} />
            </motion.div>
          )}

          {activeTab === 'gallery' && (
            <motion.div
              key="gallery"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
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
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              <Leaderboard photos={leaderboard} isLoading={isLoadingLeaderboard} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Score Reveal Modal */}
      <AnimatePresence>
        {scoreResult && (
          <ScoreReveal
            score={scoreResult.score}
            review={scoreResult.review}
            filename={photos.find((p) => p.id === scoreResult.id)?.filename ?? ''}
            engine={photos.find((p) => p.id === scoreResult.id)?.engine}
            onClose={() => setScoreResult(null)}
          />
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="relative z-20 border-t border-gold-500/5 bg-arena-900/50 mt-auto">
        <div className="max-w-6xl mx-auto px-4 py-5 text-center">
          <p className="text-arena-600 text-xs flex items-center justify-center gap-2">
            <Swords className="w-3 h-3" />
            AI 评审团 · 你的作品，我来评判
            <Swords className="w-3 h-3" />
          </p>
        </div>
      </footer>
    </div>
  )
}
