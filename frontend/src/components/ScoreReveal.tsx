import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Star, Quote, ChevronDown, ChevronUp, Sparkles } from 'lucide-react'

interface ScoreRevealProps {
  score: number
  review: string
  filename: string
  engine?: string
  onClose: () => void
}

export default function ScoreReveal({
  score,
  review,
  filename,
  engine,
  onClose,
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

  const getRankLabel = (s: number) => {
    if (s >= 4.5) return 'Legendary'
    if (s >= 4.0) return 'Masterpiece'
    if (s >= 3.5) return 'Exceptional'
    if (s >= 3.0) return 'Promising'
    if (s >= 2.0) return 'Developing'
    return 'Observer'
  }

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
        <div className="bg-ink-900 border border-ink-800/80 rounded-3xl overflow-hidden">
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-ink-800/80 flex items-center justify-center text-cream-muted hover:text-cream transition-colors z-10"
          >
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>

          <div className="p-8 md:p-10">
            {/* Engine */}
            <div className="flex items-center gap-2 mb-8">
              <Sparkles className="w-3.5 h-3.5 text-gold-400" strokeWidth={1.5} />
              <span className="text-[11px] font-medium tracking-[0.15em] uppercase text-cream-muted">
                {engineLabel} Critique
              </span>
            </div>

            {/* Filename */}
            <p className="text-xs text-cream-subtle mb-8 truncate">{filename}</p>

            {/* Score */}
            <div className="text-center mb-8">
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

              {/* Rank */}
              <AnimatePresence>
                {phase === 'revealed' && (
                  <motion.span
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-block text-xs font-medium tracking-[0.1em] uppercase text-gold-400 bg-gold-400/8 px-4 py-1.5 rounded-full"
                  >
                    {getRankLabel(score)}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            {/* Review */}
            <AnimatePresence>
              {phase === 'revealed' && review && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
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
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
