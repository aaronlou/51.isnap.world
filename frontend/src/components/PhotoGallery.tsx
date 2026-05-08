import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, Loader2, ImageOff, X, ChevronLeft, ChevronRight } from 'lucide-react'
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
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

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
          <ImageOff className="w-5 h-5 text-cream-subtle" strokeWidth={1.5} />
        </div>
        <p className="text-cream-muted text-sm">No photos yet</p>
        <p className="text-cream-subtle text-xs mt-1">Upload your first photograph</p>
      </div>
    )
  }

  const openLightbox = (index: number) => setLightboxIndex(index)
  const closeLightbox = () => setLightboxIndex(null)
  const prevImage = () => setLightboxIndex((i) => (i !== null ? (i - 1 + photos.length) % photos.length : null))
  const nextImage = () => setLightboxIndex((i) => (i !== null ? (i + 1) % photos.length : null))

  return (
    <div>
      {/* Header */}
      <div className="text-center mb-12">
        <p className="label mb-3">Collection</p>
        <h2 className="heading-display text-4xl md:text-5xl text-cream mb-3">
          Gallery
        </h2>
        <p className="text-cream-muted text-sm">
          {photos.length} photos · {photos.filter((p) => p.score !== undefined).length} reviewed
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {photos.map((photo, index) => {
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
                    <div className="flex items-center gap-1.5">
                      <Star className="w-3 h-3 fill-gold-400 text-gold-400" strokeWidth={1.5} />
                      <span className="text-xs font-medium text-cream">{photo.score?.toFixed(1)}</span>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); onScore(photo.id) }}
                      disabled={scoringId === photo.id}
                      className="text-[11px] font-medium text-gold-400 hover:text-gold-300 transition-colors disabled:opacity-50"
                    >
                      {scoringId === photo.id ? 'Reviewing...' : 'Get critique'}
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
                src={photos[lightboxIndex].url}
                alt={photos[lightboxIndex].filename}
                className="max-w-full max-h-[85vh] object-contain rounded-2xl"
              />
            </motion.div>

            {/* Image info */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-ink-900/80 backdrop-blur-md rounded-full px-5 py-2.5 border border-ink-700/40">
              <span className="text-xs text-cream-muted">{photos[lightboxIndex].filename}</span>
              {photos[lightboxIndex].score !== undefined && (
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
                {lightboxIndex + 1} / {photos.length}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
