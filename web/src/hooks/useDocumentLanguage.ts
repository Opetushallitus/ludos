import { useEffect } from 'react'
import { useLudosTranslation } from './useLudosTranslation'

export function useDocumentLanguage() {
  const { i18n, t } = useLudosTranslation()

  useEffect(() => {
    document.documentElement.lang = i18n.language
    document.title = t('title.ludos')
  }, [i18n.language, t])
}
