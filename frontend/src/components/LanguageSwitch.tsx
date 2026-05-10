import { useLocale } from '@/i18n/LocaleContext'
import { Languages } from 'lucide-react'

export default function LanguageSwitch() {
  const { locale, setLocale } = useLocale()

  return (
    <button
      onClick={() => setLocale(locale === 'zh' ? 'en' : 'zh')}
      className="flex items-center gap-1.5 text-xs text-cream-muted hover:text-gold-400 transition-colors"
      title={locale === 'zh' ? 'Switch to English' : '切换至中文'}
    >
      <Languages className="w-3.5 h-3.5" strokeWidth={1.5} />
      <span className="hidden sm:inline">{locale === 'zh' ? 'English' : '中文'}</span>
    </button>
  )
}
