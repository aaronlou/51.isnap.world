import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Star,
  Swords,
  Crown,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react'
import type { BattleResult } from '@/types/photo'
import { useLocale } from '@/i18n/LocaleContext'

interface BattleRevealProps {
  result: BattleResult | null
  onClose: () => void
}

export default function BattleReveal({ result, onClose }: BattleRevealProps) {
  const { t } = useLocale()
  const [displayUserScore, setDisplayUserScore] = useState(0)
  const [displayOpponentScore, setDisplayOpponentScore] = useState(0)
  const [phase, setPhase] = useState<'counting' | 'revealed'>('counting')
  const [showComparison, setShowComparison] = useState(false)
  const [showUserReview, setShowUserReview] = useState(false)
  const [showOpponentReview, setShowOpponentReview] = useState(false)

  const userScore = result?.user_score ?? 0
  const opponentScore = result?.opponent_score ?? 0

  useEffect(() => {
    if (!result) return
    setPhase('counting')
    setDisplayUserScore(0)
    setDisplayOpponentScore(0)
    setShowComparison(false)
    setShowUserReview(false)
    setShowOpponentReview(false)

    const duration = 2000
    const steps = 50
    const userIncrement = userScore / steps
    const oppIncrement = opponentScore / steps
    let currentUser = 0
    let currentOpp = 0
    let step = 0

    const timer = setInterval(() => {
      step++
      currentUser += userIncrement
      currentOpp += oppIncrement

      if (step >= steps) {
        setDisplayUserScore(userScore)
        setDisplayOpponentScore(opponentScore)
        setPhase('revealed')
        clearInterval(timer)
      } else {
        setDisplayUserScore(parseFloat(currentUser.toFixed(1)))
        setDisplayOpponentScore(parseFloat(currentOpp.toFixed(1)))
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [result, userScore, opponentScore])

  const winner = result?.winner ?? 'draw'
  const isUserWin = winner === 'user'
  const isOpponentWin = winner === 'opponent'
  const isDraw = winner === 'draw'

  const winnerText = useMemo(() => {
    if (isUserWin) return { label: t('battleReveal.win'), sub: t('battleReveal.winSub') }
    if (isOpponentWin) return { label: t('battleReveal.lose'), sub: t('battleReveal.loseSub') }
    return { label: t('battleReveal.draw'), sub: t('battleReveal.drawSub') }
  }, [isUserWin, isOpponentWin, t])

  const userTier = useMemo(() => {
    if (userScore >= 4.5) return t('score.legendary')
    if (userScore >= 4.0) return t('score.master')
    if (userScore >= 3.5) return t('score.outstanding')
    if (userScore >= 3.0) return t('score.risingStar')
    if (userScore >= 2.0) return t('score.advancing')
    return t('score.freshman')
  }, [userScore, t])

  if (!result) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/90 backdrop-blur-xl overflow-y-auto"
      onClick={onClose}
    >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            className="relative w-full max-w-2xl my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative bg-ink-900 border border-ink-800/80 rounded-3xl overflow-hidden">
              {/* Close */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-ink-800/80 flex items-center justify-center text-cream-muted hover:text-cream transition-colors z-20"
              >
                <X className="w-4 h-4" strokeWidth={1.5} />
              </button>

              {/* Header */}
              <div className="p-6 md:p-8 pb-0">
                <div className="flex items-center gap-2 mb-6">
                  <Swords className="w-3.5 h-3.5 text-gold-400" strokeWidth={1.5} />
                  <span className="text-[11px] font-medium tracking-[0.15em] uppercase text-cream-muted">
                    {t('battleReveal.title')}
                  </span>
                  <span className="text-cream-subtle mx-1">·</span>
                  <Sparkles className="w-3 h-3 text-cream-subtle" strokeWidth={1.5} />
                  <span className="text-[11px] text-cream-subtle">Gemini</span>
                </div>
              </div>

              {/* Photos Comparison */}
              <div className="px-6 md:px-8">
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {/* User Photo */}
                  <div className="relative">
                    <div className="aspect-[4/3] rounded-xl overflow-hidden bg-ink-800">
                      <img
                        src={result.user_photo.url}
                        alt={result.user_photo.filename}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute top-2 left-2 bg-ink-950/80 backdrop-blur-sm rounded-full px-2.5 py-1">
                      <span className="text-[10px] font-medium text-cream">{t('battleReveal.yourLabel')}</span>
                    </div>
                    {phase === 'revealed' && isUserWin && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gold-400 flex items-center justify-center z-10"
                      >
                        <Crown className="w-4 h-4 text-ink-950" strokeWidth={1.5} />
                      </motion.div>
                    )}
                  </div>

                  {/* Opponent Photo */}
                  <div className="relative">
                    <div className="aspect-[4/3] rounded-xl overflow-hidden bg-ink-800">
                      <img
                        src={result.opponent_photo_url}
                        alt={result.opponent_photo_title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute top-2 left-2 bg-ink-950/80 backdrop-blur-sm rounded-full px-2.5 py-1 max-w-[80%] truncate">
                      <span className="text-[10px] font-medium text-cream truncate block">
                        {result.opponent_photo_title}
                      </span>
                    </div>
                    {phase === 'revealed' && isOpponentWin && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gold-400 flex items-center justify-center z-10"
                      >
                        <Crown className="w-4 h-4 text-ink-950" strokeWidth={1.5} />
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Scores */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                  {/* User Score */}
                  <div className="text-center">
                    <motion.div
                      className="heading-display text-5xl md:text-6xl text-cream leading-none mb-2"
                      style={{ fontWeight: 300 }}
                    >
                      {displayUserScore.toFixed(1)}
                    </motion.div>
                    <div className="h-1 bg-ink-800 rounded-full overflow-hidden mb-2 max-w-[120px] mx-auto">
                      <motion.div
                        className="h-full rounded-full bg-gold-400"
                        initial={{ width: 0 }}
                        animate={{ width: `${(displayUserScore / 5) * 100}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                      />
                    </div>
                    <div className="flex justify-center gap-0.5 mb-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3 h-3 transition-all duration-500 ${
                            phase === 'revealed' && s <= Math.round(userScore)
                              ? 'fill-gold-400 text-gold-400'
                              : 'text-ink-700'
                          }`}
                          strokeWidth={1.5}
                        />
                      ))}
                    </div>
                    <AnimatePresence>
                      {phase === 'revealed' && (
                        <motion.div
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-0.5"
                        >
                          <span className="text-[10px] font-medium tracking-[0.1em] uppercase text-gold-400">
                            {userTier}
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Opponent Score */}
                  <div className="text-center">
                    <motion.div
                      className="heading-display text-5xl md:text-6xl text-cream leading-none mb-2"
                      style={{ fontWeight: 300 }}
                    >
                      {displayOpponentScore.toFixed(1)}
                    </motion.div>
                    <div className="h-1 bg-ink-800 rounded-full overflow-hidden mb-2 max-w-[120px] mx-auto">
                      <motion.div
                        className="h-full rounded-full bg-cyan-400"
                        initial={{ width: 0 }}
                        animate={{ width: `${(displayOpponentScore / 5) * 100}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                      />
                    </div>
                    <div className="flex justify-center gap-0.5 mb-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3 h-3 transition-all duration-500 ${
                            phase === 'revealed' && s <= Math.round(opponentScore)
                              ? 'fill-cyan-400 text-cyan-400'
                              : 'text-ink-700'
                          }`}
                          strokeWidth={1.5}
                        />
                      ))}
                    </div>
                    <AnimatePresence>
                      {phase === 'revealed' && (
                        <motion.div
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-0.5"
                        >
                          <span className="text-[10px] font-medium tracking-[0.1em] uppercase text-cyan-400">
                            {t('battleReveal.opponentLabel')}
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Winner Banner */}
                <AnimatePresence>
                  {phase === 'revealed' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 }}
                      className={`text-center mb-6 p-4 rounded-2xl border ${
                        isUserWin
                          ? 'bg-gold-400/5 border-gold-400/20'
                          : isOpponentWin
                          ? 'bg-cyan-400/5 border-cyan-400/20'
                          : 'bg-ink-800/30 border-ink-700/30'
                      }`}
                    >
                      <p className="text-lg font-medium text-cream mb-1">
                        {winnerText.label}
                      </p>
                      <p className="text-[11px] text-cream-subtle">{winnerText.sub}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Reviews Section */}
              <div className="px-6 md:px-8 pb-8 space-y-3">
                {/* User Review */}
                <AnimatePresence>
                  {phase === 'revealed' && result.user_review && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <button
                        onClick={() => setShowUserReview(!showUserReview)}
                        className="w-full flex items-center justify-between bg-ink-800/40 rounded-xl px-4 py-3 border border-ink-700/30 hover:border-ink-600/50 transition-colors group"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-gold-400" />
                          <span className="text-xs font-medium text-cream-muted">
                            {t('battleReveal.yourReview')}
                          </span>
                        </div>
                        {showUserReview ? (
                          <ChevronUp className="w-4 h-4 text-cream-subtle" strokeWidth={1.5} />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-cream-subtle" strokeWidth={1.5} />
                        )}
                      </button>
                      <AnimatePresence>
                        {showUserReview && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="bg-ink-800/20 rounded-xl p-4 border border-ink-700/20 mt-1">
                              <p className="text-xs text-cream-muted leading-relaxed">
                                {result.user_review}
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Opponent Review */}
                <AnimatePresence>
                  {phase === 'revealed' && result.opponent_review && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      <button
                        onClick={() => setShowOpponentReview(!showOpponentReview)}
                        className="w-full flex items-center justify-between bg-ink-800/40 rounded-xl px-4 py-3 border border-ink-700/30 hover:border-ink-600/50 transition-colors group"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                          <span className="text-xs font-medium text-cream-muted">
                            {t('battleReveal.opponentReview')}
                          </span>
                        </div>
                        {showOpponentReview ? (
                          <ChevronUp className="w-4 h-4 text-cream-subtle" strokeWidth={1.5} />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-cream-subtle" strokeWidth={1.5} />
                        )}
                      </button>
                      <AnimatePresence>
                        {showOpponentReview && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="bg-ink-800/20 rounded-xl p-4 border border-ink-700/20 mt-1">
                              <p className="text-xs text-cream-muted leading-relaxed">
                                {result.opponent_review}
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Comparison */}
                <AnimatePresence>
                  {phase === 'revealed' && result.comparison && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                    >
                      <button
                        onClick={() => setShowComparison(!showComparison)}
                        className="w-full flex items-center justify-between bg-ink-800/40 rounded-xl px-4 py-3 border border-ink-700/30 hover:border-ink-600/50 transition-colors group"
                      >
                        <div className="flex items-center gap-2">
                          <Swords className="w-3 h-3 text-gold-400" strokeWidth={1.5} />
                          <span className="text-xs font-medium text-cream-muted">
                            {t('battleReveal.comparison')}
                          </span>
                        </div>
                        {showComparison ? (
                          <ChevronUp className="w-4 h-4 text-cream-subtle" strokeWidth={1.5} />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-cream-subtle" strokeWidth={1.5} />
                        )}
                      </button>
                      <AnimatePresence>
                        {showComparison && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="bg-ink-800/20 rounded-xl p-4 border border-ink-700/20 mt-1">
                              <p className="text-xs text-cream-muted leading-relaxed whitespace-pre-wrap">
                                {result.comparison}
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Unsplash Attribution */}
                <AnimatePresence>
                  {phase === 'revealed' && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.8 }}
                      className="pt-2 border-t border-ink-800/40"
                    >
                      <a
                        href={result.opponent_photo_html_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 text-[10px] text-cream-subtle hover:text-gold-400 transition-colors"
                      >
                        <span>
                          {t('battleReveal.attribution')}{result.opponent_photo_title} — {t('battleReveal.photographerBy')}
                          {result.opponent_photographer}，{t('battleReveal.fromUnsplash')}
                        </span>
                        <ExternalLink className="w-3 h-3" strokeWidth={1.5} />
                      </a>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </motion.div>
  )
}
