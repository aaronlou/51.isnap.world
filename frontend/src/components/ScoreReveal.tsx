import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Star, Quote, ChevronDown, ChevronUp, Sparkles, Crown, Trophy, Swords, ArrowUp } from 'lucide-react'

interface ScoreRevealProps {
  score: number
  review: string
  filename: string
  engine?: string
  rank?: number | null
  totalScored?: number
  onClose: () => void
  onViewLeaderboard?: () => void
}

function Confetti({ isPodium }: { isPodium: boolean }) {
  if (!isPodium) return null
  const colors = ['#FFD700', '#FF6B35', '#00E5FF', '#FF4081', '#76FF03', '#E040FB']
  const particles = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.5,
    color: colors[i % colors.length],
    size: 4 + Math.random() * 8,
    rotate: Math.random() * 360,
  }))
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute"
          style={{
            left: `${p.x}%`,
            top: -10,
            width: p.size,
            height: p.size * 1.5,
            borderRadius: 2,
            backgroundColor: p.color,
          }}
          initial={{ y: -20, rotate: 0, opacity: 1 }}
          animate={{
            y: [null, 500 + Math.random() * 300],
            rotate: p.rotate,
            opacity: [1, 0.8, 0],
          }}
          transition={{
            duration: 2 + Math.random() * 1.5,
            delay: p.delay,
            ease: [0.25, 0.1, 0.25, 1],
          }}
        />
      ))}
    </div>
  )
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <div className="flex items-center gap-1.5 text-gold-400"><Crown className="w-5 h-5" strokeWidth={1.5} /><span className="text-sm font-bold">#1</span></div>
  if (rank === 2) return <div className="flex items-center gap-1.5 text-cream-muted"><Trophy className="w-5 h-5" strokeWidth={1.5} /><span className="text-sm font-bold">#2</span></div>
  if (rank === 3) return <div className="flex items-center gap-1.5 text-amber-600"><Trophy className="w-5 h-5" strokeWidth={1.5} /><span className="text-sm font-bold">#3</span></div>
  return <div className="flex items-center gap-1.5 text-cream-subtle"><ArrowUp className="w-4 h-4" strokeWidth={1.5} /><span className="text-sm font-medium">#{rank}</span></div>
}

export default function ScoreReveal({
  score,
  review,
  filename,
  engine,
  rank,
  totalScored,
  onClose,
  onViewLeaderboard,
}: ScoreRevealProps) {
  const [displayScore, setDisplayScore] = useState(0)
  const [phase, setPhase] = useState<'counting' | 'revealed'>('counting')
  const [showAttributes, setShowAttributes] = useState(false)

  useEffect(() => {
    const duration = 1800
    const steps = 40
    const increment = score / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= score) {
        setDisplayScore(score)
        setPhase('revealed')
        clearInterval(timer)
      } else {
        setDisplayScore(parseFloat(current.toFixed(1)))
      }
    }, duration / steps)
    return () => clearInterval(timer)
  }, [score])

  const isPodium = rank !== null && rank !== undefined && rank <= 3
  const rankLabel = useMemo(() => {
    if (score >= 4.5) return { label: '传奇之作', sub: '堪称传世经典的摄影杰作' }
    if (score >= 4.0) return { label: '大师之作', sub: '出色的摄影功底和艺术表现力' }
    if (score >= 3.5) return { label: '出类拔萃', sub: '在竞技场中极具竞争力的作品' }
    if (score >= 3.0) return { label: '潜力新星', sub: '展现出了不俗的摄影天赋' }
    if (score >= 2.0) return { label: '进阶之路', sub: '正在磨练你的摄影眼' }
    return { label: '初入江湖', sub: '多看看大师作品，继续加油' }
  }, [score])

  const parseAttributes = (reviewText: string): { title: string; content: string }[] => {
    const attributes: { title: string; content: string }[] = []
    const regex = /【([^】]+)】([^【]*)/g
    let match
    while ((match = regex.exec(reviewText)) !== null) {
      attributes.push({ title: match[1].trim(), content: match[2].trim() })
    }
    return attributes
  }

  const attributes = parseAttributes(review)
  const hasAttributes = attributes.length > 0
  const engineLabel = engine === 'artimuse' ? 'ArtiMuse' : engine === 'gemini' ? 'Gemini' : engine || 'AI'
  const filledStars = Math.round(score)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/90 backdrop-blur-xl"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.97 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        className="relative w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative bg-ink-900 border border-ink-800/80 rounded-3xl overflow-hidden">
          <Confetti isPodium={isPodium && phase === 'revealed'} />

          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-ink-800/80 flex items-center justify-center text-cream-muted hover:text-cream transition-colors z-10"
          >
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>

          <div className="p-8 md:p-10">
            {/* Battle header */}
            <div className="flex items-center gap-2 mb-6">
              <Swords className="w-3.5 h-3.5 text-gold-400" strokeWidth={1.5} />
              <span className="text-[11px] font-medium tracking-[0.15em] uppercase text-cream-muted">
                评审结果
              </span>
              <span className="text-cream-subtle mx-1">·</span>
              <Sparkles className="w-3 h-3 text-cream-subtle" strokeWidth={1.5} />
              <span className="text-[11px] text-cream-subtle">{engineLabel}</span>
            </div>

            {/* Filename */}
            <p className="text-xs text-cream-subtle mb-8 truncate">{filename}</p>

            {/* Score */}
            <div className="text-center mb-6">
              <motion.div
                className="heading-display text-8xl md:text-9xl text-cream leading-none mb-3"
                style={{ fontWeight: 300 }}
              >
                {displayScore.toFixed(1)}
              </motion.div>

              {/* Score bar */}
              <div className="max-w-[200px] mx-auto mb-4">
                <div className="h-1 bg-ink-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gold-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${(displayScore / 5) * 100}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                </div>
              </div>

              {/* Stars */}
              <div className="flex justify-center gap-1.5 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 transition-all duration-500 ${
                      phase === 'revealed' && star <= filledStars
                        ? 'fill-gold-400 text-gold-400'
                        : 'text-ink-700'
                    }`}
                    strokeWidth={1.5}
                  />
                ))}
              </div>

              {/* Rank + Tier */}
              <AnimatePresence>
                {phase === 'revealed' && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3"
                  >
                    <span className="inline-block text-xs font-medium tracking-[0.1em] uppercase text-gold-400 bg-gold-400/8 px-4 py-1.5 rounded-full">
                      {rankLabel.label}
                    </span>
                    <p className="text-[11px] text-cream-subtle">{rankLabel.sub}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Battle ranking result */}
            <AnimatePresence>
              {phase === 'revealed' && rank !== null && rank !== undefined && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className={`text-center mb-6 p-4 rounded-2xl border ${
                    isPodium
                      ? 'bg-gold-400/5 border-gold-400/20'
                      : 'bg-ink-800/30 border-ink-700/30'
                  }`}
                >
                  {isPodium ? (
                    <div className="space-y-2">
                      <div className="flex justify-center">
                        <RankBadge rank={rank} />
                      </div>
                      <p className="text-sm font-medium text-cream">
                        {rank === 1
                          ? '🏆 恭喜登顶！你的作品称霸竞技场！'
                          : rank === 2
                          ? '🥈 太棒了！一举夺得亚军宝座！'
                          : '🥉 闯进三甲，实力不凡！'}
                      </p>
                      <p className="text-[11px] text-cream-subtle">
                        在 {totalScored || '—'} 名挑战者中排名第 {rank}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex justify-center">
                        <RankBadge rank={rank} />
                      </div>
                      <p className="text-sm text-cream-muted">
                        {rank <= 10
                          ? `激烈竞争！已跻身前十榜单`
                          : `摄影之路，始于足下`}
                      </p>
                      <p className="text-[11px] text-cream-subtle">
                        {rank <= 10
                          ? '研究榜上前辈的作品，继续打磨技艺'
                          : '每一位大师都曾是初学者，坚持拍摄！'}
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Review */}
            <AnimatePresence>
              {phase === 'revealed' && review && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="relative bg-ink-800/50 rounded-2xl p-5 border border-ink-700/40 mb-4">
                    <Quote className="absolute top-3 left-3 w-4 h-4 text-ink-600" strokeWidth={1.5} />
                    {hasAttributes ? (
                      <p className="text-sm text-cream-muted leading-relaxed pl-5">
                        Analysis across <span className="text-gold-400">{attributes.length}</span> dimensions
                      </p>
                    ) : (
                      <p className="text-sm text-cream-muted leading-relaxed pl-5">{review}</p>
                    )}
                  </div>

                  {hasAttributes && (
                    <div className="space-y-2">
                      <button
                        onClick={() => setShowAttributes(!showAttributes)}
                        className="w-full flex items-center justify-between bg-ink-800/40 rounded-xl px-4 py-3 border border-ink-700/30 hover:border-ink-600/50 transition-colors group"
                      >
                        <span className="text-xs font-medium text-cream-muted">
                          {attributes.length} dimensions
                        </span>
                        {showAttributes ? (
                          <ChevronUp className="w-4 h-4 text-cream-subtle" strokeWidth={1.5} />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-cream-subtle" strokeWidth={1.5} />
                        )}
                      </button>

                      <AnimatePresence>
                        {showAttributes && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="overflow-hidden"
                          >
                            <div className="space-y-2 pb-1">
                              {attributes.map((attr, idx) => (
                                <motion.div
                                  key={idx}
                                  initial={{ opacity: 0, x: -12 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: idx * 0.04 }}
                                  className="bg-ink-800/30 rounded-xl p-4 border border-ink-700/20"
                                >
                                  <h4 className="text-[10px] font-medium tracking-[0.15em] uppercase text-gold-400 mb-1.5">
                                    {attr.title}
                                  </h4>
                                  <p className="text-xs text-cream-subtle leading-relaxed">
                                    {attr.content}
                                  </p>
                                </motion.div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* View leaderboard CTA */}
            <AnimatePresence>
              {phase === 'revealed' && onViewLeaderboard && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="mt-6 text-center"
                >
                  <button
                    onClick={onViewLeaderboard}
                    className="text-[11px] font-medium tracking-[0.1em] uppercase text-gold-400 hover:text-gold-300 transition-colors"
                  >
                    查看完整排行榜 →
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
