import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Grid3X3, BarChart3 } from 'lucide-react'
import UploadZone from '@/components/UploadZone'
import ScoreReveal from '@/components/ScoreReveal'
import Leaderboard from '@/components/Leaderboard'
import PhotoGallery from '@/components/PhotoGallery'
import { usePhotos } from '@/hooks/usePhotos'
import { useLeaderboard } from '@/hooks/useLeaderboard'
import type { Tab } from '@/types/photo'

const tabs: { id: Tab; label: string; icon: typeof Camera }[] = [
  { id: 'upload', label: 'Submit', icon: Camera },
  { id: 'gallery', label: 'Gallery', icon: Grid3X3 },
  { id: 'leaderboard', label: 'Rankings', icon: BarChart3 },
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
      setTimeout(() => handleScore(newPhoto.id), 400)
    }
  }

  const scoredCount = photos.filter((p) => p.score !== undefined).length

  return (
    <div className="min-h-screen bg-ink-950 text-cream grain">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-ink-950/80 backdrop-blur-xl border-b border-ink-800/40">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="heading-display text-2xl text-cream tracking-tight">
              Photo Battle
            </span>
            <span className="text-[10px] font-medium tracking-[0.15em] uppercase text-gold-400 bg-gold-400/8 px-2 py-0.5 rounded-full">
              Arena
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-cream-muted">
            <span className="w-1.5 h-1.5 rounded-full bg-gold-400" />
            <span>{scoredCount} reviewed</span>
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
      <footer className="fixed bottom-0 left-0 right-0 z-30 bg-ink-950/60 backdrop-blur-md border-t border-ink-800/20">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <p className="text-[11px] text-cream-subtle tracking-wide">
            AI Photography Critique
          </p>
          <p className="text-[11px] text-cream-subtle">
            {photos.length} photos · {scoredCount} reviewed
          </p>
        </div>
      </footer>
    </div>
  )
}
