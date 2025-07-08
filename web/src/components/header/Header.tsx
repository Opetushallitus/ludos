import { IS_MOBILE_QUERY } from '../../constants'
import { useLudosTranslation } from '../../hooks/useLudosTranslation'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { ContentType, Exam } from '../../types'
import { contentListPath, etusivuKey, examPath, frontpagePath, ldKey, puhviKey, sukoKey } from '../LudosRoutes'
import { HeaderDesktop } from './HeaderDesktop'
import { HeaderMobile } from './HeaderMobile'

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
