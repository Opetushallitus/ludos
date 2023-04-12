import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

const loadResources = async () => {
  const result = await fetch('api/localization/')
  return result.json()
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    debug: true,
    detection: {
      order: ['cookie'],
      cookieOptions: {
        sameSite: 'lax',
        secure: true
      }
    },
    fallbackLng: 'fi',
    resources: await loadResources()
  })

export default i18n
