import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { defaultLanguage } from './contexts/LudosContext'

const loadResources = async () => {
  try {
    const result = await fetch('/api/localization', { redirect: 'error' })

    if (!result.ok) {
      return []
    }

    return result.json()
  } catch (error) {
    console.error('Failed to load localization resources', error)
    return []
  }
}

const i18nOptions = {
  debug: false,
  lng: localStorage.getItem('i18nextLng')?.toUpperCase() || defaultLanguage,
  detection: {
    order: ['localStorage']
  },
  resources: await loadResources()
}

await i18n.use(LanguageDetector).use(initReactI18next).init(i18nOptions)
