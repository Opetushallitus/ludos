import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

const loadResources = async () => {
  try {
    const result = await fetch('/api/localization')

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
  debug: true,
  lng: localStorage.getItem('i18nextLng') || 'fi',
  detection: {
    order: ['localStorage']
  },
  resources: await loadResources()
}

i18n.use(LanguageDetector).use(initReactI18next).init(i18nOptions)

export default i18n
