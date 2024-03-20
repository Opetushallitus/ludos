import { useMediaQuery } from '../../hooks/useMediaQuery'
import { IS_MOBILE_QUERY } from '../../constants'
import { HeaderMobile } from './HeaderMobile'
import { HeaderDesktop } from './HeaderDesktop'
import { contentListPath, etusivuKey, examPath, frontpagePath, ldKey, puhviKey, sukoKey } from '../LudosRoutes'
import { ContentType, Exam } from '../../types'
import { useLudosTranslation } from '../../hooks/useLudosTranslation'

export interface HeaderPage {
  key: string
  localizationText: string
  path: string
  navigateTo?: string
}

export const Header = () => {
  const { t } = useLudosTranslation()
  const isMobile = useMediaQuery({ query: IS_MOBILE_QUERY })

  const pages: HeaderPage[] = [
    {
      key: `${etusivuKey}`,
      localizationText: t('header.etusivu'),
      path: frontpagePath()
    },
    {
      key: `${sukoKey}`,
      localizationText: t('header.suko'),
      path: examPath(Exam.SUKO),
      navigateTo: contentListPath(Exam.SUKO, ContentType.ASSIGNMENT)
    },
    {
      key: `${ldKey}`,
      localizationText: t('header.ld'),
      path: examPath(Exam.LD),
      navigateTo: contentListPath(Exam.LD, ContentType.ASSIGNMENT)
    },
    {
      key: `${puhviKey}`,
      localizationText: t('header.puhvi'),
      path: examPath(Exam.PUHVI),
      navigateTo: contentListPath(Exam.PUHVI, ContentType.ASSIGNMENT)
    }
  ]
  if (isMobile) {
    return <HeaderMobile pages={pages} />
  }

  return <HeaderDesktop pages={pages} />
}
