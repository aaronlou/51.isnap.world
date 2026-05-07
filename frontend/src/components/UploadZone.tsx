import { useState, useCallback, useRef } from 'react'
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
  Target,
  Crosshair,
  Flame,
} from 'lucide-react'

interface UploadZoneProps {
  onUpload: (file: File) => Promise<void>
  isUploading: boolean
}

export default function UploadZone({ onUpload, isUploading }: UploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isHovered, setIsHovered] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
      // Reset input so same file can be selected again
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
    <div className="w-full max-w-2xl mx-auto">
      {/* Hero section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-8"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-neon-red/10 via-gold-500/10 to-neon-blue/10 border border-gold-500/20 rounded-full px-4 py-1.5 mb-6 neon-border"
        >
          <Flame className="w-4 h-4 text-gold-400" />
          <span className="text-sm text-gold-300 font-medium tracking-wide">
            五一假期 · AI 摄影大乱斗
          </span>
          <Sparkles className="w-3.5 h-3.5 text-gold-400" />
        </motion.div>

        <h2 className="text-4xl md:text-6xl font-display gold-gradient-text mb-3 tracking-wide text-shadow-glow leading-tight">
          挑战 AI 评审团
        </h2>
        <p className="text-arena-300 text-sm md:text-base max-w-lg mx-auto leading-relaxed">
          上传你的摄影作品，让 AI 评审官从构图、光影、创意等维度给出专业评判。
          <br />
          <span className="text-gold-400/80">你的作品能否征服评审团？</span>
        </p>
      </motion.div>

      {/* Upload Arena - Main interactive area */}
      <motion.div
        onDragOver={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setIsDragOver(true)
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        animate={{
          scale: isDragOver ? 1.02 : 1,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className={`
          relative rounded-2xl cursor-pointer select-none
          ${isDragOver
            ? 'shadow-[0_0_40px_rgba(229,166,35,0.3),0_0_80px_rgba(229,166,35,0.1)]'
            : isHovered
              ? 'shadow-[0_0_30px_rgba(229,166,35,0.15)]'
              : 'shadow-[0_0_20px_rgba(0,0,0,0.3)]'
          }
        `}
      >
        {/* Animated border gradient */}
        <div className={`
          absolute -inset-[1.5px] rounded-2xl pointer-events-none z-0 transition-opacity duration-500
          ${isDragOver || isHovered ? 'opacity-100' : 'opacity-40'}
        `}>
          <div className="absolute inset-0 rounded-2xl"
            style={{
              background: 'conic-gradient(from 0deg, rgba(229,166,35,0.8), rgba(255,46,99,0.5), rgba(0,217,255,0.5), rgba(229,166,35,0.8))',
              animation: 'spin 8s linear infinite',
            }}
          />
          <div className="absolute inset-[1.5px] rounded-2xl bg-arena-800" />
        </div>

        {/* Inner content area */}
        <div
          className={`
            relative rounded-2xl overflow-hidden transition-all duration-500 z-10
            ${isDragOver ? 'bg-arena-800/95' : 'bg-arena-800/70'}
          `}
        >
          {/* Hidden file input - properly positioned */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,.jpg"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading}
          />

          {/* Background glow effects */}
          <motion.div
            className="absolute inset-0 opacity-30 pointer-events-none"
            animate={{
              background: isDragOver
                ? 'radial-gradient(ellipse at center, rgba(229,166,35,0.15) 0%, transparent 70%)'
                : isHovered
                  ? 'radial-gradient(ellipse at center, rgba(229,166,35,0.08) 0%, transparent 70%)'
                  : 'radial-gradient(ellipse at center, rgba(229,166,35,0.03) 0%, transparent 70%)',
            }}
            transition={{ duration: 0.5 }}
          />

          {/* Corner brackets */}
          <div className="absolute top-3 left-3 w-6 h-6 border-l-2 border-t-2 border-gold-500/30 rounded-tl" />
          <div className="absolute top-3 right-3 w-6 h-6 border-r-2 border-t-2 border-gold-500/30 rounded-tr" />
          <div className="absolute bottom-3 left-3 w-6 h-6 border-l-2 border-b-2 border-gold-500/30 rounded-bl" />
          <div className="absolute bottom-3 right-3 w-6 h-6 border-r-2 border-b-2 border-gold-500/30 rounded-br" />

          {isUploading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-5 py-12 px-8 relative z-10"
            >
              {/* Spinning loader */}
              <div className="relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                  className="relative z-10"
                >
                  <Crosshair className="w-16 h-16 text-gold-400" />
                </motion.div>
                {/* Outer ring */}
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-dashed border-gold-500/30"
                  animate={{ rotate: -360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  style={{ margin: '-8px' }}
                />
                {/* Glow */}
                <motion.div
                  className="absolute inset-0 rounded-full"
                  animate={{
                    boxShadow: [
                      '0 0 20px rgba(229, 166, 35, 0.3)',
                      '0 0 50px rgba(229, 166, 35, 0.5)',
                      '0 0 20px rgba(229, 166, 35, 0.3)',
                    ],
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              </div>

              <div className="space-y-3 text-center">
                <p className="text-gold-300 font-bold text-lg tracking-wide">
                  AI 评审团正在审视你的作品...
                </p>
                {/* Progress bar */}
                <div className="w-72 h-2 bg-arena-700 rounded-full overflow-hidden mx-auto relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold-500/20 to-transparent animate-shimmer" />
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-gold-500 via-neon-red to-gold-500"
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ width: '40%' }}
                  />
                </div>
                <div className="flex items-center justify-center gap-4 text-xs text-arena-400 mt-2">
                  <span className="flex items-center gap-1 px-2 py-1 bg-arena-700/50 rounded-full">
                    <Target className="w-3 h-3 text-gold-400" /> 分析构图
                  </span>
                  <span className="flex items-center gap-1 px-2 py-1 bg-arena-700/50 rounded-full">
                    <Zap className="w-3 h-3 text-neon-blue" /> 评估创意
                  </span>
                  <span className="flex items-center gap-1 px-2 py-1 bg-arena-700/50 rounded-full">
                    <Sparkles className="w-3 h-3 text-neon-purple" /> 生成评语
                  </span>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-5 py-10 px-8 relative z-10"
            >
              {/* Central VS Icon with effects */}
              <div className="relative">
                {/* Outer glow rings */}
                <motion.div
                  className="absolute -inset-8 rounded-2xl border border-gold-500/10"
                  animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.1, 0.3] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
                <motion.div
                  className="absolute -inset-12 rounded-2xl border border-gold-500/5"
                  animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.05, 0.2] }}
                  transition={{ duration: 4, repeat: Infinity }}
                />

                {/* Main icon container */}
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="relative"
                >
                  <div className={`
                    w-28 h-28 rounded-2xl flex items-center justify-center border-2 transition-all duration-500
                    ${isHovered || isDragOver
                      ? 'bg-gradient-to-br from-gold-500/30 via-neon-red/10 to-gold-500/20 border-gold-500/50 shadow-[0_0_30px_rgba(229,166,35,0.3)]'
                      : 'bg-gradient-to-br from-gold-500/15 via-neon-red/5 to-gold-500/10 border-gold-500/25'
                    }
                  `}>
                    <Swords className="w-14 h-14 text-gold-400" />
                  </div>
                  {/* VS badge */}
                  <motion.div
                    className="absolute -top-2 -right-2 bg-gradient-to-br from-neon-red to-neon-pink rounded-full px-2.5 py-0.5 shadow-lg shadow-neon-red/30"
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <span className="text-xs font-black text-white">VS</span>
                  </motion.div>
                </motion.div>
              </div>

              <div className="space-y-2 text-center">
                <p className="text-xl text-arena-100 font-bold flex items-center gap-2 justify-center">
                  <Upload className="w-5 h-5 text-gold-400" />
                  上传你的摄影作品
                </p>
                <p className="text-sm text-arena-400">
                  拖拽或点击上传 · JPG 格式 · 最大 30MB
                </p>
              </div>

              {/* Action hint */}
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="flex items-center gap-3 text-xs text-gold-500/80 mt-1 bg-arena-700/40 rounded-full px-5 py-2 border border-gold-500/15"
              >
                <Zap className="w-3.5 h-3.5 text-gold-400" />
                <span>AI 将从构图 · 光影 · 创意 · 情感等维度给出专业评判</span>
              </motion.div>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="mt-4 flex items-center gap-2 text-neon-red bg-neon-red/10 border border-neon-red/30 rounded-xl px-4 py-3 shadow-[0_0_20px_rgba(255,46,99,0.1)]"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Judge panel */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-6 flex items-center justify-center gap-8 text-xs"
      >
        <div className="flex items-center gap-2 px-3 py-1.5 bg-arena-800/50 rounded-full border border-gold-500/10">
          <span className="w-2 h-2 rounded-full bg-gold-500 animate-pulse" />
          <span className="text-arena-400">AI 评审官 Gemini</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-arena-800/50 rounded-full border border-neon-purple/10">
          <span className="w-2 h-2 rounded-full bg-neon-purple animate-pulse" />
          <span className="text-arena-400">AI 评审官 ArtiMuse</span>
        </div>
      </motion.div>
    </div>
  )
}
