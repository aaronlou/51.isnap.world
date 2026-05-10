import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { apiClient } from '@/api/client'
import { translations, type Locale, type TranslationKey } from './locales'

interface LocaleContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: TranslationKey) => string
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

const STORAGE_KEY = 'isnap_locale'

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en')

  // On mount: detect locale from backend, then allow manual override from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null
    if (stored === 'zh' || stored === 'en') {
      setLocaleState(stored)
      return
    }
    // No stored preference — detect from backend
    apiClient.get<{ locale: Locale }>('/api/locale', { timeout: 3000 })
      .then((res) => {
        const detected = res.data.locale
        if (detected === 'zh' || detected === 'en') {
          setLocaleState(detected)
        }
      })
      .catch(() => {
        // Fallback: use browser language
        const lang = navigator.language || 'en'
        setLocaleState(lang.startsWith('zh') ? 'zh' : 'en')
      })
  }, [])

  const setLocale = (l: Locale) => {
    setLocaleState(l)
    localStorage.setItem(STORAGE_KEY, l)
  }

  const t = (key: TranslationKey): string => {
    return translations[locale][key]
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider')
  return ctx
}
