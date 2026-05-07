import { motion } from 'framer-motion'
import { Star, Loader2, Trophy, Crown, Medal } from 'lucide-react'
import type { Photo } from '@/types/photo'

interface LeaderboardProps {
  photos: Photo[]
  isLoading: boolean
}

const rankConfig = [
  { icon: Crown, label: '1st', color: 'text-gold-400' },
  { icon: Medal, label: '2nd', color: 'text-cream-muted' },
  { icon: Medal, label: '3rd', color: 'text-amber-600' },
]

export default function Leaderboard({ photos, isLoading }: LeaderboardProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 text-cream-muted animate-spin" strokeWidth={1.5} />
      </div>
    )
  }

  if (photos.length === 0) {
    return (
      <div className="text-center py-32">
        <div className="w-12 h-12 rounded-full bg-ink-900 border border-ink-800 flex items-center justify-center mx-auto mb-5">
          <Trophy className="w-5 h-5 text-cream-subtle" strokeWidth={1.5} />
        </div>
        <p className="text-cream-muted text-sm">No ranked photos yet</p>
        <p className="text-cream-subtle text-xs mt-1">Upload and review to enter the rankings</p>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="text-center mb-12">
        <p className="label mb-3">Rankings</p>
        <h2 className="heading-display text-4xl md:text-5xl text-cream mb-3">
          Leaderboard
        </h2>
        <p className="text-cream-muted text-sm">
          Top-rated photographs by AI critique
        </p>
      </div>

      {/* Top 3 Podium */}
      {photos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
          {photos.slice(0, 3).map((photo, index) => {
            const config = rankConfig[index] || rankConfig[2]
            const Icon = config.icon
            const isFirst = index === 0

            return (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                className={`relative rounded-2xl overflow-hidden border ${
                  isFirst
                    ? 'border-gold-400/20 bg-ink-900/80'
                    : 'border-ink-800/60 bg-ink-900/40'
                }`}
              >
                {/* Rank badge */}
                <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-ink-950/70 backdrop-blur-sm rounded-full px-2.5 py-1">
                  <Icon className={`w-3 h-3 ${config.color}`} strokeWidth={1.5} />
                  <span className={`text-[10px] font-medium ${config.color}`}>{config.label}</span>
                </div>

                {/* Score */}
                <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-ink-950/70 backdrop-blur-sm rounded-full px-2.5 py-1">
                  <Star className="w-2.5 h-2.5 fill-gold-400 text-gold-400" strokeWidth={1.5} />
                  <span className="text-[10px] font-medium text-cream">{photo.score?.toFixed(1)}</span>
                </div>

                {/* Image */}
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={photo.url}
                    alt={photo.filename}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>

                {/* Info */}
                <div className="p-3">
                  <p className="text-xs text-cream truncate">{photo.filename}</p>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Rest of list */}
      {photos.length > 3 && (
        <div className="space-y-2">
          {photos.slice(3).map((photo, index) => (
            <motion.div
              key={photo.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.04 }}
              className="flex items-center gap-4 p-3 rounded-xl bg-ink-900/40 border border-ink-800/40 hover:border-ink-700/50 transition-colors"
            >
              <span className="text-xs font-medium text-cream-subtle w-6 text-center">
                {index + 4}
              </span>
              <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0">
                <img
                  src={photo.url}
                  alt={photo.filename}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-cream truncate">{photo.filename}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Star className="w-3 h-3 fill-gold-400 text-gold-400" strokeWidth={1.5} />
                <span className="text-sm font-medium text-cream">{photo.score?.toFixed(1)}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
