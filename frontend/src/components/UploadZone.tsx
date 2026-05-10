import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Image, AlertCircle, Loader2 } from 'lucide-react'
import { useLocale } from '@/i18n/LocaleContext'

interface UploadZoneProps {
  onUpload: (file: File) => Promise<void>
  isUploading: boolean
}

export default function UploadZone({ onUpload, isUploading }: UploadZoneProps) {
  const { t } = useLocale()
  const [isDragOver, setIsDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    if (file.type !== 'image/jpeg') {
      return t('upload.errorFormat')
    }
    if (file.size > 30 * 1024 * 1024) {
      return t('upload.errorSize')
    }
    return null
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragOver(false)
      setError(null)
      const file = e.dataTransfer.files[0]
      if (!file) return
      const err = validateFile(file)
      if (err) {
        setError(err)
        return
      }
      onUpload(file)
    },
    [onUpload],
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setError(null)
      const file = e.target.files?.[0]
      if (!file) return
      const err = validateFile(file)
      if (err) {
        setError(err)
        return
      }
      onUpload(file)
      e.target.value = ''
    },
    [onUpload],
  )

  const handleClick = useCallback(() => {
    if (!isUploading && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }, [isUploading])

  return (
    <div className="w-full max-w-xl mx-auto">
      {/* Hero text */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        className="text-center mb-16"
      >
        <p className="label mb-6">{t('upload.heroLabel')}</p>
        <h2 className="heading-display text-5xl md:text-6xl text-cream mb-5 text-balance">
          {t('upload.heroTitle')}
        </h2>
        <p className="text-cream-muted text-sm md:text-base max-w-md mx-auto leading-relaxed">
          {t('upload.heroDesc')}
        </p>
      </motion.div>

      {/* Upload zone */}
      <motion.div
        onDragOver={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setIsDragOver(true)
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={handleClick}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="relative"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,.jpg"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading}
        />

        <div
          className={`
            relative rounded-3xl border transition-all duration-500 cursor-pointer overflow-hidden
            ${isDragOver
              ? 'border-gold-400/60 bg-ink-900/80'
              : 'border-ink-700/60 bg-ink-900/40 hover:border-ink-600 hover:bg-ink-900/60'
            }
          `}
        >
          <div className="py-16 px-8 flex flex-col items-center text-center">
            {isUploading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-6"
              >
                <Loader2 className="w-8 h-8 text-gold-400 animate-spin" strokeWidth={1.5} />
                <div>
                  <p className="text-cream text-sm font-medium mb-2">{t('upload.uploading')}</p>
                  <p className="text-cream-subtle text-xs">{t('upload.uploadingSub')}</p>
                </div>
              </motion.div>
            ) : (
              <>
                <div
                  className={`
                    w-16 h-16 rounded-full border flex items-center justify-center mb-6 transition-all duration-500
                    ${isDragOver
                      ? 'border-gold-400/50 bg-gold-400/5'
                      : 'border-ink-700 bg-ink-800/50'
                    }
                  `}
                >
                  <Upload className="w-6 h-6 text-cream-muted" strokeWidth={1.5} />
                </div>
                <p className="text-cream text-base font-medium mb-1.5">
                  {t('upload.dropLabel')}
                </p>
                <p className="text-cream-subtle text-xs">
                  {t('upload.formatHint')}
                </p>
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mt-4 flex items-center gap-2.5 text-cream bg-red-950/40 border border-red-900/40 rounded-xl px-4 py-3"
          >
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" strokeWidth={1.5} />
            <span className="text-sm">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Judges */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-12 flex items-center justify-center gap-6"
      >
        <div className="flex items-center gap-2 text-xs text-cream-subtle">
          <span className="w-1.5 h-1.5 rounded-full bg-gold-400/60" />
          <span>{t('upload.judgeGemini')}</span>
        </div>
        <div className="w-px h-3 bg-ink-700" />
        <div className="flex items-center gap-2 text-xs text-cream-subtle">
          <span className="w-1.5 h-1.5 rounded-full bg-cream-muted/40" />
          <span>{t('upload.judgeVolc')}</span>
        </div>
      </motion.div>
    </div>
  )
}
