import { motion } from 'framer-motion'
import { Star, Loader2, ImageOff, Swords, Sparkles, Zap } from 'lucide-react'
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
            <Loader2 className="w-10 h-10 text-gold-400" />
          </motion.div>
          <motion.div
            className="absolute inset-0 rounded-full border border-gold-500/20"
            animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      </div>
    )
  }

  if (photos.length === 0) {
    return (
      <div className="text-center py-20 max-w-md mx-auto">
        <div className="relative inline-block mb-6">
          <div className="w-20 h-20 rounded-2xl bg-arena-800 border border-arena-600/30 flex items-center justify-center mx-auto">
            <Swords className="w-10 h-10 text-arena-500" />
          </div>
          <motion.div
            className="absolute -inset-3 rounded-2xl border border-arena-600/20"
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
          共 {photos.length} 件作品 · {photos.filter((p) => p.score !== undefined).length} 件已评审
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
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              {/* VS accent line for unscored */}
              {!hasScore && (
                <div className="absolute -top-px left-4 right-4 h-px bg-gradient-to-r from-transparent via-gold-500/40 to-transparent z-20 opacity-0 group-hover:opacity-100 transition-opacity" />
              )}

              <div className="relative rounded-xl overflow-hidden bg-arena-800/80 border border-arena-600/20 group-hover:border-gold-500/30 transition-colors duration-300">
                {/* Image */}
                <div className="relative aspect-square overflow-hidden">
                  <img
                    src={photo.url}
                    alt={photo.filename}
                    className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-arena-900/90 via-arena-900/20 to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-300" />

                  {/* Score badge (scored) */}
                  {hasScore && (
                    <div className="absolute top-2 right-2 bg-arena-900/90 backdrop-blur-md rounded-full px-2.5 py-1 flex items-center gap-1.5 border border-gold-500/30 z-10">
                      <Star className="w-3 h-3 text-gold-400 fill-gold-400" />
                      <span className="number-display text-sm text-gold-300">
                        {photo.score!.toFixed(1)}
                      </span>
                    </div>
                  )}

                  {/* Pending badge */}
                  {!hasScore && (
                    <div className="absolute top-2 left-2 bg-arena-900/70 backdrop-blur-sm rounded-full px-2 py-0.5 border border-arena-500/30 z-10">
                      <span className="text-[10px] text-arena-400 font-medium">待评审</span>
                    </div>
                  )}

                  {/* Hover overlay for unscored */}
                  {!hasScore && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onScore(photo.id)}
                        disabled={scoringId === photo.id}
                        className="bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-arena-900 font-bold px-5 py-2.5 rounded-full text-sm flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-gold-500/30"
                      >
                        {scoringId === photo.id ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            评审中...
                          </>
                        ) : (
                          <>
                            <Swords className="w-4 h-4" />
                            申请评审
                          </>
                        )}
                      </motion.button>
                    </div>
                  )}
                </div>

                {/* Info bar */}
                <div className="p-3 space-y-1">
                  <p className="text-arena-200 text-xs truncate font-medium">
                    {photo.filename}
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-arena-500 text-[10px]">
                      {new Date(photo.uploaded_at).toLocaleDateString('zh-CN')}
                    </p>
                    {hasScore && (
                      <span className="text-[10px] text-arena-500 flex items-center gap-0.5">
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
