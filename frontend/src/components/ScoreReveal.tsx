import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Star,
  Quote,
  X,
  Swords,
  ChevronDown,
  ChevronUp,
  Brain,
  Sparkles,
  Trophy,
  Zap,
} from 'lucide-react'

interface ScoreRevealProps {
  score: number
  review: string
  filename: string
  engine?: string
  onClose: () => void
}

function ConfettiPiece({ delay, x, y, color }: { delay: number; x: string; y: string; color: string }) {
  return (
    <motion.div
      className="absolute w-2 h-2 rounded-sm"
      style={{ left: x, top: y, background: color }}
      initial={{ opacity: 0, scale: 0, rotate: 0 }}
      animate={{
        opacity: [0, 1, 1, 0],
        scale: [0, 1.5, 1, 0],
        rotate: [0, 180, 360],
        y: [0, -100 - Math.random() * 200, 30],
        x: [0, (Math.random() - 0.5) * 300],
      }}
      transition={{ duration: 2, delay, ease: 'easeOut' }}
    />
  )
}

export default function ScoreReveal({
  score,
  review,
  filename,
  engine,
  onClose,
}: ScoreRevealProps) {
  const [displayScore, setDisplayScore] = useState(0)
  const [phase, setPhase] = useState<'vs' | 'counting' | 'revealed'>('vs')
  const [showAttributes, setShowAttributes] = useState(false)

  // VS flash phase → counting phase
  useEffect(() => {
    const vsTimer = setTimeout(() => setPhase('counting'), 800)
    return () => clearTimeout(vsTimer)
  }, [])

  // Counting animation
  useEffect(() => {
    if (phase !== 'counting') return

    const duration = 2000
    const steps = 50
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
  }, [phase, score])

  const getRankColor = (s: number) => {
    if (s >= 4.5) return 'text-gold-300'
    if (s >= 4.0) return 'text-gold-400'
    if (s >= 3.5) return 'text-silver-300'
    if (s >= 3.0) return 'text-amber-400'
    return 'text-arena-400'
  }

  const getRankLabel = (s: number) => {
    if (s >= 4.5) return '传奇摄影师'
    if (s >= 4.0) return '光影大师'
    if (s >= 3.5) return '构图高手'
    if (s >= 3.0) return '潜力新星'
    if (s >= 2.0) return '探索者'
    return '起步观察家'
  }

  const getScoreBarColor = (s: number) => {
    if (s >= 4.5) return 'from-gold-400 via-gold-500 to-neon-red'
    if (s >= 4.0) return 'from-gold-400 to-gold-500'
    if (s >= 3.5) return 'from-silver-300 to-silver-400'
    if (s >= 3.0) return 'from-amber-400 to-amber-500'
    return 'from-arena-400 to-arena-500'
  }

  const confettiColors = [
    '#e5a623', '#f0c674', '#ff2e63', '#00d9ff',
    '#b829dd', '#ff6b9d', '#f2cd60', '#c78a00',
  ]

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
  const engineLabel = engine === 'artimuse' ? 'ArtiMuse' : engine === 'gemini' ? 'Gemini' : engine === 'volcengine' ? 'VolcEngine' : 'AI'
  const isArtiMuse = engine === 'artimuse'
  const isVolcEngine = engine === 'volcengine'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-arena-900/95 backdrop-blur-2xl"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 250 }}
        className="relative w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* VS Flash Phase */}
        <AnimatePresence>
          {phase === 'vs' && (
            <motion.div
              key="vs-phase"
              initial={{ opacity: 0, scale: 2 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.4 }}
              className="relative z-30 flex flex-col items-center justify-center py-24"
            >
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 0.5, repeat: 3 }}
              >
                <Swords className="w-24 h-24 text-gold-400" />
              </motion.div>
              <motion.h2
                className="text-8xl font-display gold-gradient-text mt-4"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6, repeat: 2 }}
              >
                VS
              </motion.h2>
              <motion.p
                className="text-arena-400 text-sm mt-4 font-medium tracking-widest"
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 0.5, repeat: 3 }}
              >
                AI 评审团裁定中...
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Score Result Phase */}
        <AnimatePresence>
          {phase !== 'vs' && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative rounded-2xl overflow-hidden"
            >
              {/* Confetti overlay */}
              {phase === 'revealed' && (
                <div className="absolute inset-0 pointer-events-none z-0">
                  {Array.from({ length: 25 }).map((_, i) => (
                    <ConfettiPiece
                      key={i}
                      delay={i * 0.06}
                      x={`${20 + Math.random() * 60}%`}
                      y={`${50 + Math.random() * 30}%`}
                      color={confettiColors[i % confettiColors.length]}
                    />
                  ))}
                </div>
              )}

              {/* Background */}
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  background: `linear-gradient(180deg, rgba(229, 166, 35, 0.2) 0%, transparent 40%)`,
                }}
              />

              {/* Card */}
              <div className="relative z-10 bg-gradient-to-b from-arena-800/90 to-arena-900/90 border border-gold-500/20 rounded-2xl backdrop-blur-xl max-h-[90vh] flex flex-col">
                <button
                  onClick={onClose}
                  className="absolute -top-2.5 -right-2.5 w-8 h-8 rounded-full bg-arena-800 border border-arena-600/40 flex items-center justify-center text-arena-400 hover:text-white hover:bg-arena-700 transition-all z-20"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="p-6 md:p-8 text-center overflow-y-auto">
                  {/* Engine badge */}
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-center gap-2 mb-3"
                  >
                    {isArtiMuse ? (
                      <span className="inline-flex items-center gap-1.5 bg-neon-purple/10 border border-neon-purple/20 rounded-full px-3 py-1">
                        <Brain className="w-3.5 h-3.5 text-neon-purple" />
                        <span className="text-xs text-neon-purple/80 font-medium">
                          ArtiMuse 评审官
                        </span>
                      </span>
                    ) : isVolcEngine ? (
                      <span className="inline-flex items-center gap-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-3 py-1">
                        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="text-xs text-cyan-400/80 font-medium">
                          VolcEngine 评审官
                        </span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 bg-gold-500/10 border border-gold-500/20 rounded-full px-3 py-1">
                        <Sparkles className="w-3.5 h-3.5 text-gold-400" />
                        <span className="text-xs text-gold-400/80 font-medium">
                          AI 评审官
                        </span>
                      </span>
                    )}
                  </motion.div>

                  {/* VS small badge */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="flex items-center justify-center gap-2 text-xs text-arena-500 mb-2"
                  >
                    <Swords className="w-3 h-3 text-gold-500/50" />
                    <span>评审结果</span>
                    <Swords className="w-3 h-3 text-gold-500/50" />
                  </motion.div>

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.15 }}
                    className="text-sm text-arena-400 mb-1 truncate max-w-xs mx-auto"
                  >
                    {filename}
                  </motion.p>

                  {/* Score number */}
                  <div className="relative mb-3 mt-2">
                    <motion.div
                      className={`number-display text-8xl md:text-9xl font-bold ${getRankColor(score)}`}
                      animate={
                        phase === 'revealed'
                          ? {
                              scale: [1, 1.1, 1],
                              textShadow: [
                                '0 0 30px rgba(229, 166, 35, 0)',
                                '0 0 80px rgba(229, 166, 35, 0.5)',
                                '0 0 30px rgba(229, 166, 35, 0.2)',
                              ],
                            }
                          : {}
                      }
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    >
                      {displayScore.toFixed(1)}
                    </motion.div>

                    {/* Score bar */}
                    <div className="max-w-xs mx-auto mt-3">
                      <div className="h-2 bg-arena-700 rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full bg-gradient-to-r ${getScoreBarColor(score)}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${(displayScore / 5) * 100}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-arena-600 mt-0.5 px-0.5">
                        <span>0</span>
                        <span>5</span>
                      </div>
                    </div>

                    {/* Stars */}
                    <div className="flex justify-center gap-1.5 mt-3">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <motion.div
                          key={star}
                          initial={{ opacity: 0, scale: 0, rotate: -180 }}
                          animate={{
                            opacity: phase === 'revealed' && star <= Math.round(score) ? 1 : 0.15,
                            scale: 1,
                            rotate: 0,
                            color:
                              phase === 'revealed' && star <= Math.round(score)
                                ? '#e5a623'
                                : '#252545',
                          }}
                          transition={{
                            delay: 0.3 + star * 0.15,
                            type: 'spring',
                            stiffness: 200,
                          }}
                        >
                          <Star className={`w-6 h-6 ${phase === 'revealed' && star <= Math.round(score) ? 'fill-gold-400' : ''}`} />
                        </motion.div>
                      ))}
                    </div>

                    {/* Rank label */}
                    <AnimatePresence>
                      {phase === 'revealed' && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-4"
                        >
                          <span
                            className={`inline-flex items-center gap-1.5 px-5 py-1.5 rounded-full text-sm font-bold ${getRankColor(score)} bg-current/10 border border-current/30`}
                          >
                            <Trophy className="w-4 h-4" />
                            {getRankLabel(score)}
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Review */}
                  <AnimatePresence>
                    {phase === 'revealed' && review && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        className="text-left"
                      >
                        {/* Summary quote */}
                        <div className="relative bg-arena-800/80 rounded-xl p-4 border border-arena-600/20 mb-4">
                          <Quote className="absolute -top-1.5 -left-1.5 w-5 h-5 text-gold-500/30" />
                          {hasAttributes ? (
                            <p className="text-sm text-arena-300 leading-relaxed">
                              AI 评审官从 8 个维度为你解读了这张照片
                            </p>
                          ) : (
                            <p className="text-sm text-arena-300 leading-relaxed">
                              {review}
                            </p>
                          )}
                        </div>

                        {/* Multi-dimension */}
                        {hasAttributes && (
                          <div className="space-y-2">
                            <button
                              onClick={() => setShowAttributes(!showAttributes)}
                              className="w-full flex items-center justify-between bg-arena-800/60 rounded-xl px-4 py-3 border border-arena-600/20 hover:border-gold-500/30 transition-all duration-300 hover:bg-arena-800/80"
                            >
                              <span className="text-sm text-gold-400 font-medium flex items-center gap-2">
                                <Zap className="w-4 h-4" />
                                展开 {attributes.length} 项评审维度
                              </span>
                              {showAttributes ? (
                                <ChevronUp className="w-4 h-4 text-gold-400" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-gold-400" />
                              )}
                            </button>

                            <AnimatePresence>
                              {showAttributes && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.3 }}
                                  className="overflow-hidden"
                                >
                                  <div className="space-y-2 pb-2">
                                    {attributes.map((attr, idx) => (
                                      <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, x: -15 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="bg-arena-800/40 rounded-xl p-3.5 border border-arena-600/10"
                                        whileHover={{
                                          borderColor: 'rgba(229, 166, 35, 0.2)',
                                        }}
                                      >
                                        <h4 className="text-xs text-gold-400 font-bold mb-1.5 uppercase tracking-wider">
                                          {attr.title}
                                        </h4>
                                        <p className="text-xs text-arena-400 leading-relaxed">
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
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}
