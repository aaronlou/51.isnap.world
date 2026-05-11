import { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Grid3X3, BarChart3, Swords, Sparkles, Brain, Image as ImageIcon, Heart, Pencil, Check, X } from 'lucide-react'
import UploadZone from '@/components/UploadZone'
import ScoreReveal from '@/components/ScoreReveal'
import Leaderboard from '@/components/Leaderboard'
import PhotoGallery from '@/components/PhotoGallery'
import BattleArena from '@/components/BattleArena'
import BattleReveal from '@/components/BattleReveal'
import DonateModal from '@/components/DonateModal'
import LanguageSwitch from '@/components/LanguageSwitch'
import { usePhotos } from '@/hooks/usePhotos'
import { useLeaderboard } from '@/hooks/useLeaderboard'
import { useBattle } from '@/hooks/useBattle'
import { useLocale } from '@/i18n/LocaleContext'
import type { Tab } from '@/types/photo'
import { fetchMe, updateNickname } from '@/api/me'
import { getUserId } from '@/utils/user'

export default function App() {
  const { t } = useLocale()
  const [activeTab, setActiveTab] = useState<Tab>('upload')
  const [scoredRank, setScoredRank] = useState<number | null>(null)
  const [showDonate, setShowDonate] = useState(false)
  const [donateNotice, setDonateNotice] = useState<string | null>(null)
  const {
    photos,
    setPhotos,
    isLoading: isLoadingPhotos,
    isUploading,
    scoringId,
    scoreResult,
    setScoreResult,
    handleUpload,
    handleScore,
    handleDelete,
    loadPhotos,
  } = usePhotos()

  const { leaderboard, isLoading: isLoadingLeaderboard, loadLeaderboard } = useLeaderboard()

  const { battleResult, isBattling, battlingId, handleBattle, clearBattle } = useBattle()

  const handleCloseBattle = () => {
    // Battle 对战完成后，自动清理本地列表中的 battle 临时照片
    if (battleResult?.user_photo.is_battle) {
      setPhotos(prev => prev.filter(p => p.id !== battleResult.user_photo_id))
    }
    clearBattle()
  }

  const tabs = useMemo(() => [
    { id: 'upload' as Tab, label: t('tab.upload'), icon: Camera },
    { id: 'gallery' as Tab, label: t('tab.gallery'), icon: Grid3X3 },
    { id: 'leaderboard' as Tab, label: t('tab.leaderboard'), icon: BarChart3 },
    { id: 'battle' as Tab, label: t('tab.battle'), icon: Swords },
  ], [t])

  // 切换到 gallery 时才加载照片数据
  useEffect(() => {
    if (activeTab === 'gallery' && photos.length === 0) {
      loadPhotos()
    }
  }, [activeTab, photos.length, loadPhotos])

  // 切换到 leaderboard 时才加载排行榜数据
  useEffect(() => {
    if (activeTab === 'leaderboard' && leaderboard.length === 0) {
      loadLeaderboard()
    }
  }, [activeTab, leaderboard.length, loadLeaderboard])

  // 处理 Stripe 打赏回调
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const donateStatus = params.get('donate')
    if (donateStatus === 'success') {
      setDonateNotice(t('app.donateSuccess'))
      window.history.replaceState({}, '', window.location.pathname)
      const timer = setTimeout(() => setDonateNotice(null), 4000)
      return () => clearTimeout(timer)
    }
    if (donateStatus === 'cancel') {
      setDonateNotice(t('app.donateCancel'))
      window.history.replaceState({}, '', window.location.pathname)
      const timer = setTimeout(() => setDonateNotice(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [t])

  // When score result appears, reload leaderboard and compute rank
  useEffect(() => {
    if (scoreResult) {
      loadLeaderboard()
    }
  }, [scoreResult, loadLeaderboard])

  // Reload photos when battle tab is active and photos are stale
  useEffect(() => {
    if (activeTab === 'battle' && photos.length === 0) {
      loadPhotos()
    }
  }, [activeTab, photos.length, loadPhotos])

  // When leaderboard updates after scoring, compute rank
  useEffect(() => {
    if (scoreResult && leaderboard.length > 0) {
      const idx = leaderboard.findIndex((p) => p.id === scoreResult.id)
      setScoredRank(idx >= 0 ? idx + 1 : null)
    }
  }, [leaderboard, scoreResult])

  // Upload tab：上传 gallery 照片并自动评分
  const onUploadAndScore = async (file: File) => {
    setScoredRank(null)
    const newPhoto = await handleUpload(file, false)
    if (newPhoto) {
      setTimeout(() => handleScore(newPhoto.id), 400)
    }
  }

  // Battle tab：上传 battle 照片（不评分、不收录到 gallery）
  const onUploadOnly = async (file: File) => {
    await handleUpload(file, true)
  }

  const handleCloseScore = () => {
    setScoreResult(null)
    setScoredRank(null)
  }

  const galleryPhotos = photos.filter((p) => !p.is_battle)
  const scoredCount = galleryPhotos.filter((p) => p.score !== undefined).length

  // 用户昵称状态
  const [nickname, setNickname] = useState<string | null>(null)
  const [isEditingNickname, setIsEditingNickname] = useState(false)
  const [editNicknameValue, setEditNicknameValue] = useState('')
  const nicknameInputRef = useRef<HTMLInputElement>(null)

  // 加载用户昵称
  const loadNickname = async () => {
    try {
      const me = await fetchMe()
      if (me) {
        setNickname(me.nickname)
      }
    } catch {
      // 静默失败：未激活用户没有记录
    }
  }

  useEffect(() => {
    loadNickname()
  }, [photos.length])

  const startEditNickname = () => {
    setEditNicknameValue(nickname || '')
    setIsEditingNickname(true)
    setTimeout(() => nicknameInputRef.current?.focus(), 50)
  }

  const cancelEditNickname = () => {
    setIsEditingNickname(false)
    setEditNicknameValue('')
  }

  const saveNickname = async () => {
    const trimmed = editNicknameValue.trim()
    if (!trimmed || trimmed.length > 32) {
      cancelEditNickname()
      return
    }
    try {
      await updateNickname(trimmed)
      setNickname(trimmed)
    } catch (err) {
      console.error('Failed to update nickname:', err)
    }
    setIsEditingNickname(false)
  }

  return (
    <div className="min-h-screen bg-ink-950 text-cream grain">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-ink-950/80 backdrop-blur-xl border-b border-ink-800/40">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="heading-display text-2xl text-cream tracking-tight">
              {t('app.title')}
            </span>
            <span className="text-[10px] font-medium tracking-[0.15em] uppercase text-gold-400 bg-gold-400/8 px-2 py-0.5 rounded-full">
              {t('app.badge')}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitch />
            <button
              onClick={() => setShowDonate(true)}
              className="flex items-center gap-1.5 text-xs text-cream-muted hover:text-gold-400 transition-colors"
            >
              <Heart className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>{t('app.donate')}</span>
            </button>
            {/* Nickname display / editor */}
            {nickname && !isEditingNickname && (
              <button
                onClick={startEditNickname}
                className="flex items-center gap-1 text-xs text-gold-400 bg-gold-400/8 hover:bg-gold-400/15 px-2.5 py-1 rounded-full transition-colors"
                title="Click to edit nickname"
              >
                <span>{nickname}</span>
                <Pencil className="w-3 h-3 opacity-60" strokeWidth={1.5} />
              </button>
            )}
            {isEditingNickname && (
              <div className="flex items-center gap-1">
                <input
                  ref={nicknameInputRef}
                  value={editNicknameValue}
                  onChange={(e) => setEditNicknameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveNickname()
                    if (e.key === 'Escape') cancelEditNickname()
                  }}
                  onBlur={saveNickname}
                  className="w-28 text-xs bg-ink-900 border border-gold-400/30 rounded-full px-2.5 py-1 text-cream outline-none focus:border-gold-400/60"
                  maxLength={32}
                />
                <button onClick={saveNickname} className="text-gold-400 hover:text-gold-300">
                  <Check className="w-3.5 h-3.5" strokeWidth={2} />
                </button>
                <button onClick={cancelEditNickname} className="text-cream-subtle hover:text-cream">
                  <X className="w-3.5 h-3.5" strokeWidth={2} />
                </button>
              </div>
            )}
            <div className="hidden sm:flex items-center gap-2 text-xs text-cream-muted">
              <span className="w-1.5 h-1.5 rounded-full bg-gold-400" />
              <span>{scoredCount} {t('app.scoredCount')}</span>
            </div>
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
                  data-tab={tab.id}
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
              <UploadZone onUpload={onUploadAndScore} isUploading={isUploading} />
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
                onDelete={handleDelete}
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

          {activeTab === 'battle' && (
            <motion.div
              key="battle"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <BattleArena
                photos={photos}
                isLoading={isLoadingPhotos}
                onLoadPhotos={loadPhotos}
                onBattle={handleBattle}
                isBattling={isBattling}
                battlingId={battlingId}
                onUpload={onUploadOnly}
                isUploading={isUploading}
              />
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
                <h3 className="text-lg font-medium text-cream mb-2">{t('app.scoring.title')}</h3>
                <p className="text-sm text-cream-muted">{t('app.scoring.subtitle')}</p>
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
                    <p className="text-[10px] text-cream-subtle">{t('app.scoring.volcengine')}</p>
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
                    <p className="text-[10px] text-cream-subtle">{t('app.scoring.gemini')}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 text-center">
                <motion.div
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-[11px] text-cream-subtle"
                >
                  {t('app.scoring.waiting')}
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
            accepted={scoreResult.accepted}
            personalStats={scoreResult.personal_stats}
            onClose={handleCloseScore}
            onViewLeaderboard={() => {
              handleCloseScore()
              setActiveTab('leaderboard')
            }}
          />
        )}
      </AnimatePresence>

      {/* Battle Reveal Modal */}
      <AnimatePresence>
        {battleResult && (
          <BattleReveal
            result={battleResult}
            onClose={handleCloseBattle}
          />
        )}
      </AnimatePresence>

      {/* Donate Modal */}
      <DonateModal isOpen={showDonate} onClose={() => setShowDonate(false)} />

      {/* Donate notice toast */}
      <AnimatePresence>
        {donateNotice && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-ink-900 border border-gold-400/30 rounded-full px-6 py-2.5 text-sm text-gold-400 shadow-lg"
          >
            {donateNotice}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 z-30 bg-ink-950/60 backdrop-blur-md border-t border-ink-800/20">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <p className="text-[11px] text-cream-subtle tracking-wide">
            {t('app.footer')}
          </p>
          <p className="text-[11px] text-cream-subtle">
            {galleryPhotos.length} {t('app.footerCount')} · {scoredCount} {t('app.scoredCount')}
          </p>
        </div>
      </footer>
    </div>
  )
}
