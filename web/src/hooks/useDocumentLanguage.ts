import { useTranslation } from 'react-i18next'
import { useEffect } from 'react'

export function useDocumentLanguage() {
  const { i18n, t } = useTranslation()

  useEffect(() => {
    document.documentElement.lang = i18n.language
    document.title = t('title.ludos')
  }, [i18n.language, t])
}
