import { motion } from 'framer-motion'
import { Star, Loader2, Trophy, Crown, Medal, Swords } from 'lucide-react'
import type { Photo } from '@/types/photo'
import { useLocale } from '@/i18n/LocaleContext'

interface LeaderboardProps {
  photos: Photo[]
  isLoading: boolean
}

export default function Leaderboard({ photos, isLoading }: LeaderboardProps) {
  const { t } = useLocale()

  const rankConfig = [
    { icon: Crown, label: t('leaderboard.champion'), color: 'text-gold-400', border: 'border-gold-400/30', glow: 'shadow-gold-400/10' },
    { icon: Trophy, label: t('leaderboard.runnerUp'), color: 'text-slate-300', border: 'border-slate-400/20', glow: '' },
    { icon: Medal, label: t('leaderboard.thirdPlace'), color: 'text-amber-600', border: 'border-amber-600/20', glow: '' },
  ]

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
          <Swords className="w-5 h-5 text-cream-subtle" strokeWidth={1.5} />
        </div>
        <p className="text-cream-muted text-sm">{t('leaderboard.empty')}</p>
        <p className="text-cream-subtle text-xs mt-1">{t('leaderboard.emptySub')}</p>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Swords className="w-4 h-4 text-gold-400" strokeWidth={1.5} />
          <p className="label">{t('tab.battle')}</p>
        </div>
        <h2 className="heading-display text-4xl md:text-5xl text-cream mb-3">
          {t('leaderboard.title')}
        </h2>
        <p className="text-cream-muted text-sm">
          {photos.length} {t('leaderboard.subtitle')}
        </p>
      </div>

      {/* Top 3 Podium */}
      {photos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {photos.slice(0, 3).map((photo, index) => {
            const config = rankConfig[index] || rankConfig[2]
            const Icon = config.icon
            const isFirst = index === 0
            const rankEmoji = index === 0 ? '👑' : index === 1 ? '🥈' : '🥉'

            return (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.12, duration: 0.5 }}
                className={`relative rounded-2xl overflow-hidden border ${
                  isFirst
                    ? `${config.border} bg-gradient-to-b from-gold-400/5 to-ink-900/80 md:scale-105 md:-mt-4`
                    : `${config.border} bg-ink-900/40`
                }`}
              >
                {/* Podium glow for 1st */}
                {isFirst && (
                  <div className="absolute -inset-2 bg-gold-400/5 blur-2xl rounded-3xl pointer-events-none" />
                )}

                {/* Rank badge */}
                <div className={`absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-ink-950/80 backdrop-blur-sm rounded-full px-3 py-1.5 border ${config.border}`}>
                  <Icon className={`w-3.5 h-3.5 ${config.color}`} strokeWidth={1.5} />
                  <span className={`text-[10px] font-bold tracking-wider ${config.color}`}>{config.label}</span>
                </div>

                {/* Score */}
                <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-ink-950/80 backdrop-blur-sm rounded-full px-2.5 py-1">
                  <Star className="w-2.5 h-2.5 fill-gold-400 text-gold-400" strokeWidth={1.5} />
                  <span className="text-[10px] font-bold text-cream">{photo.score?.toFixed(1)}</span>
                </div>

                {/* Image */}
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={photo.thumbnail_url || photo.url}
                    alt={photo.filename}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm">{rankEmoji}</span>
                    <p className="text-sm text-cream font-medium truncate">{photo.filename}</p>
                  </div>
                  <p className="text-[10px] text-cream-subtle">
                    {isFirst ? t('leaderboard.defendingChamp') : index === 1 ? t('leaderboard.silverChallenger') : t('leaderboard.bronzeChallenger')}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Rest of list */}
      {photos.length > 3 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-4">
            <Swords className="w-3.5 h-3.5 text-cream-subtle" strokeWidth={1.5} />
            <span className="text-[11px] font-medium tracking-[0.15em] uppercase text-cream-muted">
              {t('leaderboard.challengerCount')} ({photos.length - 3})
            </span>
          </div>
          {photos.slice(3).map((photo, index) => (
            <motion.div
              key={photo.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.04 }}
              className="flex items-center gap-4 p-3 rounded-xl bg-ink-900/40 border border-ink-800/40 hover:border-ink-700/50 transition-colors group"
            >
              <span className="text-xs font-mono font-bold text-cream-subtle w-6 text-center">
                {index + 4}
              </span>
              <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0">
                <img
                  src={photo.thumbnail_url || photo.url}
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
                <span className="text-sm font-bold text-cream">{photo.score?.toFixed(1)}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
