import { motion } from 'framer-motion'
import { Star, Loader2, Sparkles, Trophy, Crown, Medal, Zap, Swords, Flame } from 'lucide-react'
import type { Photo } from '@/types/photo'

interface LeaderboardProps {
  photos: Photo[]
  isLoading: boolean
}

const rankConfig = [
  {
    color: 'text-gold-300',
    bg: 'from-gold-500/25 via-gold-500/10 to-transparent',
    border: 'border-gold-500/50',
    glow: 'shadow-[0_0_30px_rgba(229,166,35,0.15)]',
    icon: Crown,
    iconColor: 'text-gold-400',
    label: '冠军',
    sublabel: '全场最佳',
    scale: 1,
  },
  {
    color: 'text-silver-300',
    bg: 'from-silver-400/20 via-silver-400/5 to-transparent',
    border: 'border-silver-400/40',
    glow: 'shadow-[0_0_20px_rgba(192,192,192,0.1)]',
    icon: Medal,
    iconColor: 'text-silver-400',
    label: '亚军',
    sublabel: '实力之作',
    scale: 0.97,
  },
  {
    color: 'text-bronze-400',
    bg: 'from-bronze-400/20 via-bronze-400/5 to-transparent',
    border: 'border-bronze-400/40',
    glow: 'shadow-[0_0_20px_rgba(205,127,50,0.1)]',
    icon: Zap,
    iconColor: 'text-bronze-400',
    label: '季军',
    sublabel: '潜力无限',
    scale: 0.94,
  },
]

export default function Leaderboard({ photos, isLoading }: LeaderboardProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="relative">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <Trophy className="w-12 h-12 text-gold-400" />
          </motion.div>
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-dashed border-gold-500/20"
            animate={{ rotate: -360, scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ margin: '-8px' }}
          />
        </div>
      </div>
    )
  }

  if (photos.length === 0) {
    return (
      <div className="text-center py-20 max-w-md mx-auto">
        <div className="relative inline-block mb-6">
          <div className="w-20 h-20 rounded-2xl bg-arena-800 border-2 border-arena-600/30 flex items-center justify-center mx-auto glow-gold">
            <Trophy className="w-10 h-10 text-arena-500" />
          </div>
          <motion.div
            className="absolute -inset-3 rounded-2xl border-2 border-dashed border-arena-600/20"
            animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.1, 0.3] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
        </div>
        <p className="text-arena-300 text-lg font-medium">冠军榜虚位以待</p>
        <p className="text-arena-500 text-sm mt-2">
          上传作品并获取 AI 评审，争夺榜首之位
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-4xl md:text-5xl font-display gold-gradient-text mb-2 text-shadow-glow">
          冠军榜单
        </h2>
        <p className="text-arena-400 text-sm flex items-center justify-center gap-2">
          <Flame className="w-3.5 h-3.5 text-gold-400" />
          经 AI 评审团认证的顶尖作品
        </p>
      </div>

      {/* Podium */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 items-end">
        {photos.map((photo, index) => {
          const config = rankConfig[index] || rankConfig[rankConfig.length - 1]
          const Icon = config.icon
          const isFirst = index === 0

          return (
            <motion.div
              key={photo.id}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: index * 0.2,
                duration: 0.6,
                ease: 'easeOut',
              }}
              className={`relative ${isFirst ? 'md:-mt-4 md:mb-4 md:col-start-2 md:row-start-1' : ''}`}
              style={{ scale: config.scale }}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
            >
              {/* Card */}
              <div
                className={`relative rounded-xl overflow-hidden bg-gradient-to-b from-arena-800/95 to-arena-900/95 border ${config.border} backdrop-blur-xl ${config.glow} transition-shadow duration-300 hover:shadow-gold`}
              >
                {/* Top glow */}
                <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-current to-transparent opacity-30" />

                {/* Rank header */}
                <div
                  className={`relative bg-gradient-to-b ${config.bg} px-4 py-3 flex items-center gap-2 border-b ${config.border}`}
                >
                  <Icon className={`w-4 h-4 ${config.iconColor}`} />
                  <span className={`text-sm font-bold ${config.color}`}>
                    {config.label}
                  </span>
                  <span className={`text-[10px] ${config.color} opacity-60 ml-auto`}>
                    {config.sublabel}
                  </span>
                </div>

                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={photo.url}
                    alt={photo.filename}
                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-arena-900/80 via-transparent to-transparent" />

                  {/* Rank number */}
                  <div className="absolute bottom-2 left-2">
                    <span className="number-display text-5xl text-white/10 font-black">
                      #{index + 1}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <p className="text-arena-200 text-sm font-medium truncate mb-3">
                    {photo.filename}
                  </p>

                  {/* Score */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <Star className="w-4 h-4 text-gold-400 fill-gold-400" />
                      <span className={`number-display text-2xl ${config.color}`}>
                        {photo.score!.toFixed(1)}
                      </span>
                      <span className="text-arena-600 text-xs">/ 5.0</span>
                    </div>
                    {photo.engine && (
                      <span className="text-[10px] text-arena-500 bg-arena-700/50 rounded-full px-2 py-0.5 border border-arena-600/20">
                        {photo.engine === 'artimuse' ? 'ArtiMuse' : photo.engine === 'gemini' ? 'Gemini' : photo.engine === 'volcengine' ? 'VolcEngine' : 'AI'}
                      </span>
                    )}
                  </div>

                  {/* Score bar */}
                  <div className="h-2 bg-arena-700 rounded-full overflow-hidden mb-2 relative">
                    <motion.div
                      className={`h-full rounded-full bg-gradient-to-r ${config.color.replace('text-', 'from-')} to-current opacity-70`}
                      initial={{ width: 0 }}
                      animate={{ width: `${((photo.score || 0) / 5) * 100}%` }}
                      transition={{ duration: 1, delay: 0.5 + index * 0.2 }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
                  </div>

                  {photo.review && (
                    <p className="text-arena-500 text-xs leading-relaxed line-clamp-2">
                      {photo.review}
                    </p>
                  )}
                </div>
              </div>

              {/* Champion glow */}
              {isFirst && (
                <motion.div
                  className="absolute -inset-4 rounded-2xl pointer-events-none -z-10"
                  animate={{
                    background: [
                      'radial-gradient(ellipse at center, rgba(229, 166, 35, 0.15) 0%, transparent 70%)',
                      'radial-gradient(ellipse at center, rgba(229, 166, 35, 0.25) 0%, transparent 70%)',
                      'radial-gradient(ellipse at center, rgba(229, 166, 35, 0.15) 0%, transparent 70%)',
                    ],
                  }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Bottom text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="text-center text-xs text-arena-600 flex items-center justify-center gap-2 pt-4"
      >
        <Sparkles className="w-3 h-3" />
        AI 评审团持续评判中 · 上传作品即可上榜
        <Sparkles className="w-3 h-3" />
      </motion.p>
    </div>
  )
}
