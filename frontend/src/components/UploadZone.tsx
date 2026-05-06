import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  Swords,
  AlertCircle,
  Loader2,
  Sparkles,
  Zap,
  Image,
  Mic,
} from 'lucide-react'

interface UploadZoneProps {
  onUpload: (file: File) => Promise<void>
  isUploading: boolean
}

export default function UploadZone({ onUpload, isUploading }: UploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validateFile = (file: File): string | null => {
    if (file.type !== 'image/jpeg') {
      return '仅支持 JPG 格式'
    }
    if (file.size > 30 * 1024 * 1024) {
      return '文件大小不能超过 30MB'
    }
    return null
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
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
    },
    [onUpload],
  )

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Hero section with arena theme */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-8"
      >
        {/* Badge row */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-neon-red/10 via-gold-500/10 to-neon-red/10 border border-gold-500/20 rounded-full px-4 py-1.5 mb-6"
        >
          <Swords className="w-4 h-4 text-gold-400" />
          <span className="text-sm text-gold-300 font-medium tracking-wide">
            五一假期 · AI 摄影大乱斗
          </span>
          <Sparkles className="w-3.5 h-3.5 text-gold-400" />
        </motion.div>

        {/* Main headline */}
        <h2 className="text-4xl md:text-5xl font-display gold-gradient-text mb-3 tracking-wide text-shadow-glow leading-tight">
          挑战 AI 评审团
        </h2>
        <p className="text-arena-300 text-sm md:text-base max-w-lg mx-auto leading-relaxed">
          上传你的摄影作品，让 AI 评审官从构图、光影、创意等维度给出专业评判。
          <br />
          你的作品能否征服评审团？
        </p>
      </motion.div>

      {/* Upload arena */}
      <motion.div
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragOver(true)
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        animate={{
          scale: isDragOver ? 1.02 : 1,
        }}
        className={`
          relative rounded-2xl p-1 transition-all duration-500
          ${isDragOver ? 'bg-gradient-to-r from-gold-500 via-neon-red to-gold-500' : 'bg-gradient-to-b from-gold-500/20 via-arena-600/20 to-gold-500/20'}
        `}
      >
        <div
          className={`
            relative rounded-xl p-8 md:p-12 text-center cursor-pointer transition-all duration-500 overflow-hidden
            ${isDragOver ? 'bg-arena-800/90' : 'bg-arena-800/60'}
            ${!isUploading ? 'hover:bg-arena-800/80' : ''}
          `}
        >
          {/* Animated gradient border overlay */}
          <motion.div
            className="absolute inset-0 opacity-20"
            animate={{
              background: [
                'linear-gradient(135deg, rgba(229, 166, 35, 0.1) 0%, transparent 50%, rgba(255, 46, 99, 0.1) 100%)',
                'linear-gradient(135deg, rgba(255, 46, 99, 0.1) 0%, transparent 50%, rgba(0, 217, 255, 0.1) 100%)',
                'linear-gradient(135deg, rgba(0, 217, 255, 0.1) 0%, transparent 50%, rgba(229, 166, 35, 0.1) 100%)',
                'linear-gradient(135deg, rgba(229, 166, 35, 0.1) 0%, transparent 50%, rgba(255, 46, 99, 0.1) 100%)',
              ],
            }}
            transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
          />

          <input
            type="file"
            accept="image/jpeg,.jpg"
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            disabled={isUploading}
          />

          {isUploading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-5 py-8 relative z-10"
            >
              <div className="relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                >
                  <Loader2 className="w-16 h-16 text-gold-400" />
                </motion.div>
                <motion.div
                  className="absolute inset-0 rounded-full"
                  animate={{
                    boxShadow: [
                      '0 0 20px rgba(229, 166, 35, 0.2)',
                      '0 0 40px rgba(229, 166, 35, 0.4)',
                      '0 0 20px rgba(229, 166, 35, 0.2)',
                    ],
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              </div>
              <div className="space-y-2">
                <p className="text-gold-300 font-medium text-lg">
                  AI 评审团正在审视你的作品...
                </p>
                <div className="w-64 h-1.5 bg-arena-700 rounded-full overflow-hidden mx-auto">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-gold-500 via-neon-red to-gold-500"
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ width: '50%' }}
                  />
                </div>
                <div className="flex items-center justify-center gap-4 text-xs text-arena-400 mt-2">
                  <span className="flex items-center gap-1">
                    <Mic className="w-3 h-3" /> 分析构图
                  </span>
                  <span className="text-arena-600">|</span>
                  <span className="flex items-center gap-1">
                    <Zap className="w-3 h-3" /> 评估创意
                  </span>
                  <span className="text-arena-600">|</span>
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> 生成评语
                  </span>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-5 py-6 relative z-10"
            >
              {/* VS Icon */}
              <div className="relative">
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="relative"
                >
                  <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-gold-500/20 via-neon-red/5 to-gold-500/10 flex items-center justify-center border border-gold-500/20">
                    <Swords className="w-14 h-14 text-gold-400" />
                  </div>
                  <motion.div
                    className="absolute -top-1 -right-1 bg-neon-red rounded-full px-2 py-0.5"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <span className="text-xs font-bold text-white">VS</span>
                  </motion.div>
                </motion.div>
                {/* Pulse ring */}
                <motion.div
                  className="absolute -inset-4 rounded-2xl border border-gold-500/20"
                  animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.05, 0.3] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
              </div>

              <div className="space-y-2">
                <p className="text-xl text-arena-100 font-medium flex items-center gap-2 justify-center">
                  <Upload className="w-5 h-5 text-gold-400" />
                  上传你的摄影作品
                </p>
                <p className="text-sm text-arena-400">
                  拖拽或点击上传 · JPG 格式 · 最大 30MB
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs text-gold-500/70 mt-2 bg-arena-700/40 rounded-full px-5 py-2 border border-gold-500/10">
                <Zap className="w-3.5 h-3.5 text-gold-400" />
                <span>AI 将从构图 · 光影 · 创意 · 情感等维度给出专业评判</span>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 flex items-center gap-2 text-neon-red bg-neon-red/10 border border-neon-red/20 rounded-lg px-4 py-3"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Judge panel preview */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-6 flex items-center justify-center gap-6 text-xs text-arena-500"
      >
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-gold-500" />
          AI 评审官 Gemini
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-neon-purple" />
          AI 评审官 ArtiMuse
        </div>
      </motion.div>
    </div>
  )
}
