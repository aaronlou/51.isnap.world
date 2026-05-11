import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, Loader2, ImageOff, X, ChevronLeft, ChevronRight, Trash2, MessageSquare, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react'
import type { Photo } from '@/types/photo'
import { useLocale } from '@/i18n/LocaleContext'

interface PhotoGalleryProps {
  photos: Photo[]
  isLoading: boolean
  onScore: (id: string) => void
  scoringId: string | null
  onDelete?: (id: string) => void
}

export default function PhotoGallery({
  photos,
  isLoading,
  onScore,
  scoringId,
  onDelete,
}: PhotoGalleryProps) {
  const { t } = useLocale()
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [expandedReview, setExpandedReview] = useState(false)

  // Gallery 只显示非 Battle 照片
  const galleryPhotos = photos.filter((p) => !p.is_battle)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 text-cream-muted animate-spin" strokeWidth={1.5} />
      </div>
    )
  }

  if (galleryPhotos.length === 0) {
    return (
      <div className="text-center py-32">
        <div className="w-12 h-12 rounded-full bg-ink-900 border border-ink-800 flex items-center justify-center mx-auto mb-5">
          <ImageOff className="w-5 h-5 text-cream-subtle" strokeWidth={1.5} />
        </div>
        <p className="text-cream-muted text-sm">{t('gallery.empty')}</p>
        <p className="text-cream-subtle text-xs mt-1">{t('gallery.emptySub')}</p>
      </div>
    )
  }

  const openLightbox = (index: number) => setLightboxIndex(index)
  const closeLightbox = () => setLightboxIndex(null)
  const prevImage = () => setLightboxIndex((i) => (i !== null ? (i - 1 + galleryPhotos.length) % galleryPhotos.length : null))
  const nextImage = () => setLightboxIndex((i) => (i !== null ? (i + 1) % galleryPhotos.length : null))

  return (
    <div>
      {/* Header */}
      <div className="text-center mb-12">
        <p className="label mb-3">{t('gallery.header')}</p>
        <h2 className="heading-display text-4xl md:text-5xl text-cream mb-3">
          {t('gallery.title')}
        </h2>
        <p className="text-cream-muted text-sm">
          {galleryPhotos.length} {t('gallery.count')} · {galleryPhotos.filter((p) => p.score !== undefined).length} {t('app.scoredCount')}
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {galleryPhotos.map((photo, index) => {
          const hasScore = photo.score !== undefined

          return (
            <motion.div
              key={photo.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04, duration: 0.4 }}
              className="group relative"
            >
              <div className="relative rounded-xl overflow-hidden bg-ink-900 border border-ink-800/60">
                {/* Image (thumbnail only, click to expand) */}
                <div
                  className="relative aspect-square overflow-hidden cursor-pointer"
                  onClick={() => openLightbox(index)}
                >
                  <img
                    src={photo.thumbnail_url}
                    alt={photo.filename}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>

                {/* Info overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-400">
                  <p className="text-[11px] text-cream truncate mb-1.5">{photo.filename}</p>
                  {hasScore ? (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <Star className="w-3 h-3 fill-gold-400 text-gold-400" strokeWidth={1.5} />
                        <span className="text-xs font-medium text-cream">{photo.score?.toFixed(1)}</span>
                      </div>
                      {photo.review && (
                        <p className="text-[10px] text-cream-subtle leading-relaxed line-clamp-2">
                          {photo.review}
                        </p>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); onScore(photo.id) }}
                      disabled={scoringId === photo.id}
                      className="text-[11px] font-medium text-gold-400 hover:text-gold-300 transition-colors disabled:opacity-50"
                    >
                      {scoringId === photo.id ? t('gallery.scoring') : t('gallery.aiScore')}
                    </button>
                  )}
                </div>

                {/* Score badge */}
                {hasScore && (
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-ink-950/70 backdrop-blur-sm rounded-full px-2 py-0.5">
                    <Star className="w-2.5 h-2.5 fill-gold-400 text-gold-400" strokeWidth={1.5} />
                    <span className="text-[10px] font-medium text-cream">{photo.score?.toFixed(1)}</span>
                  </div>
                )}

                {/* Delete button */}
                {onDelete && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(photo.id) }}
                    className="absolute top-2.5 left-2.5 w-7 h-7 rounded-full bg-ink-950/60 backdrop-blur-sm border border-ink-700/40 flex items-center justify-center text-cream-subtle hover:text-red-400 hover:border-red-400/40 transition-all opacity-0 group-hover:opacity-100"
                    title={t('gallery.delete')}
                  >
                    <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                  </button>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/95 backdrop-blur-2xl p-4"
            onClick={closeLightbox}
          >
            {/* Close button */}
            <button
              onClick={closeLightbox}
              className="absolute top-6 right-6 w-10 h-10 rounded-full bg-ink-800/80 flex items-center justify-center text-cream-muted hover:text-cream transition-colors z-10"
            >
              <X className="w-5 h-5" strokeWidth={1.5} />
            </button>

            {/* Previous */}
            <button
              onClick={(e) => { e.stopPropagation(); prevImage() }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-ink-800/60 flex items-center justify-center text-cream-muted hover:text-cream transition-colors z-10"
            >
              <ChevronLeft className="w-5 h-5" strokeWidth={1.5} />
            </button>

            {/* Next */}
            <button
              onClick={(e) => { e.stopPropagation(); nextImage() }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-ink-800/60 flex items-center justify-center text-cream-muted hover:text-cream transition-colors z-10"
            >
              <ChevronRight className="w-5 h-5" strokeWidth={1.5} />
            </button>

            {/* Full-size image */}
            <motion.div
              key={lightboxIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="max-w-full max-h-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={galleryPhotos[lightboxIndex].url}
                alt={galleryPhotos[lightboxIndex].filename}
                className="max-w-full max-h-[85vh] object-contain rounded-2xl"
              />
            </motion.div>

            {/* Image info */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4">
              {/* Pills row */}
              <div className="flex items-center justify-center gap-4 bg-ink-900/80 backdrop-blur-md rounded-full px-5 py-2.5 border border-ink-700/40 mx-auto w-fit mb-3">
                <span className="text-xs text-cream-muted">{galleryPhotos[lightboxIndex].filename}</span>
                {galleryPhotos[lightboxIndex].score !== undefined && (
                  <>
                    <span className="w-px h-3 bg-ink-700" />
                    <div className="flex items-center gap-1.5">
                      <Star className="w-3 h-3 fill-gold-400 text-gold-400" strokeWidth={1.5} />
                      <span className="text-xs font-medium text-cream">{photos[lightboxIndex].score?.toFixed(1)}</span>
                    </div>
                  </>
                )}
                <span className="w-px h-3 bg-ink-700" />
                <span className="text-[11px] text-cream-subtle">
                  {lightboxIndex + 1} / {galleryPhotos.length}
                </span>
                <span className="w-px h-3 bg-ink-700" />
                <button
                  onClick={(e) => { e.stopPropagation(); onScore(galleryPhotos[lightboxIndex].id) }}
                  disabled={scoringId === galleryPhotos[lightboxIndex].id}
                  className="flex items-center gap-1 text-[11px] font-medium text-gold-400 hover:text-gold-300 transition-colors disabled:opacity-50"
                >
                  {scoringId === galleryPhotos[lightboxIndex].id ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" strokeWidth={1.5} />
                      {t('gallery.scoring')}
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3 h-3" strokeWidth={1.5} />
                      {galleryPhotos[lightboxIndex].score !== undefined ? t('gallery.rescore') : t('gallery.review')}
                    </>
                  )}
                </button>
              </div>

              {/* Review panel */}
              {galleryPhotos[lightboxIndex].review && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="bg-ink-900/80 backdrop-blur-md rounded-2xl border border-ink-700/40 px-5 py-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-3.5 h-3.5 text-gold-400" strokeWidth={1.5} />
                    <span className="text-[10px] font-medium tracking-[0.15em] uppercase text-gold-400">
                      {t('gallery.review')}
                    </span>
                  </div>
                  <p
                    className={`text-xs text-cream-muted leading-relaxed whitespace-pre-wrap ${
                      expandedReview ? '' : 'line-clamp-3'
                    }`}
                  >
                    {galleryPhotos[lightboxIndex].review}
                  </p>
                  {galleryPhotos[lightboxIndex].review && galleryPhotos[lightboxIndex].review!.length > 100 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setExpandedReview(!expandedReview) }}
                      className="mt-2 flex items-center gap-1 text-[10px] text-cream-subtle hover:text-gold-400 transition-colors"
                    >
                      {expandedReview ? (
                        <>
                          <ChevronUp className="w-3 h-3" strokeWidth={1.5} />
                          {t('gallery.collapse')}
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3 h-3" strokeWidth={1.5} />
                          {t('gallery.expand')}
                        </>
                      )}
                    </button>
                  )}
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
