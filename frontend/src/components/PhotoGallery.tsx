import { motion } from 'framer-motion'
import { Star, Loader2, ImageOff, Swords, Sparkles, Zap, Eye } from 'lucide-react'
import type { Photo } from '@/types/photo'

interface PhotoGalleryProps {
  photos: Photo[]
  isLoading: boolean
  onScore: (id: string) => void
  scoringId: string | null
}

export default function PhotoGallery({
  photos,
  isLoading,
  onScore,
  scoringId,
}: PhotoGalleryProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="relative">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <Swords className="w-12 h-12 text-gold-400" />
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
            <ImageOff className="w-10 h-10 text-arena-500" />
          </div>
          <motion.div
            className="absolute -inset-3 rounded-2xl border-2 border-dashed border-arena-600/20"
            animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.1, 0.3] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
        </div>
        <p className="text-arena-300 text-lg font-medium">赛场上还没有作品</p>
        <p className="text-arena-500 text-sm mt-2">
          上传你的摄影作品，挑战 AI 评审团
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-4xl md:text-5xl font-display gold-gradient-text mb-2 text-shadow-glow">
          参赛作品
        </h2>
        <p className="text-arena-400 text-sm flex items-center justify-center gap-2">
          <Swords className="w-3.5 h-3.5 text-gold-400" />
          共 <span className="text-gold-400 font-bold">{photos.length}</span> 件作品 · {' '}
          <span className="text-gold-400 font-bold">{photos.filter((p) => p.score !== undefined).length}</span> 件已评审
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos.map((photo, index) => {
          const hasScore = photo.score !== undefined

          return (
            <motion.div
              key={photo.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.4 }}
              className="group relative"
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
            >
              {/* Hover glow */}
              <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-gold-500/0 via-gold-500/0 to-gold-500/0 group-hover:from-gold-500/10 group-hover:via-neon-red/5 group-hover:to-gold-500/10 transition-all duration-500 blur-xl" />

              <div className="relative rounded-xl overflow-hidden bg-arena-800/90 border border-arena-600/20 group-hover:border-gold-500/40 transition-all duration-300 shadow-lg shadow-black/20 group-hover:shadow-gold">
                {/* Image */}
                <div className="relative aspect-square overflow-hidden">
                  <img
                    src={photo.url}
                    alt={photo.filename}
                    className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-arena-900/90 via-arena-900/20 to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-300" />

                  {/* Score badge */}
                  {hasScore && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-2 right-2 bg-arena-900/90 backdrop-blur-md rounded-lg px-2.5 py-1 flex items-center gap-1.5 border border-gold-500/30 z-10 shadow-lg"
                    >
                      <Star className="w-3 h-3 text-gold-400 fill-gold-400" />
                      <span className="number-display text-sm text-gold-300 font-bold">
                        {photo.score!.toFixed(1)}
                      </span>
                    </motion.div>
                  )}

                  {/* Pending badge */}
                  {!hasScore && (
                    <div className="absolute top-2 left-2 bg-arena-900/80 backdrop-blur-sm rounded-lg px-2.5 py-1 border border-gold-500/20 z-10">
                      <span className="text-[10px] text-gold-400 font-bold tracking-wide">待评审</span>
                    </div>
                  )}

                  {/* Hover overlay for unscored */}
                  {!hasScore && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                      <motion.button
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.92 }}
                        onClick={(e) => {
                          e.stopPropagation()
                          onScore(photo.id)
                        }}
                        disabled={scoringId === photo.id}
                        className="bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-arena-900 font-bold px-5 py-2.5 rounded-full text-sm flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-gold-500/40 btn-glow"
                      >
                        {scoringId === photo.id ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            评审中...
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4" />
                            申请评审
                          </>
                        )}
                      </motion.button>
                    </div>
                  )}
                </div>

                {/* Info bar */}
                <div className="p-3 space-y-1.5">
                  <p className="text-arena-200 text-xs truncate font-medium">
                    {photo.filename}
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-arena-500 text-[10px]">
                      {new Date(photo.uploaded_at).toLocaleDateString('zh-CN')}
                    </p>
                    {hasScore && (
                      <span className="text-[10px] text-arena-500 flex items-center gap-0.5 bg-arena-700/40 rounded-full px-2 py-0.5">
                        <Zap className="w-2.5 h-2.5" />
                        {photo.engine === 'artimuse' ? 'ArtiMuse' : photo.engine === 'gemini' ? 'Gemini' : photo.engine === 'volcengine' ? 'VolcEngine' : 'AI'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
