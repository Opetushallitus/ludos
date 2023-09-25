import { useMediaQuery } from '../../hooks/useMediaQuery'
import { IS_MOBILE_QUERY } from '../../constants'
import { HeaderMobile } from './HeaderMobile'
import { HeaderDesktop } from './HeaderDesktop'
import { useUserDetails } from '../../hooks/useUserDetails'
import {
  contentListPath,
  etusivuKey,
  examPath,
  feedbackPath,
  frontpagePath,
  ldKey,
  palautteetKey,
  puhviKey,
  sukoKey
} from '../routes/LudosRoutes'
import { ContentType, Exam } from '../../types'

export interface HeaderPage {
  key: string
  path: string
  navigateTo?: string
}

export const Header = () => {
  const isMobile = useMediaQuery({ query: IS_MOBILE_QUERY })
  const { isYllapitaja } = useUserDetails()

  const pages: HeaderPage[] = [
    {
      key: `${etusivuKey}`,
      path: frontpagePath()
    },
    {
      key: `${sukoKey}`,
      path: examPath(Exam.SUKO),
      navigateTo: contentListPath(Exam.SUKO, ContentType.koetehtavat)
    },
    {
      key: `${ldKey}`,
      path: examPath(Exam.LD),
      navigateTo: contentListPath(Exam.LD, ContentType.koetehtavat)
    },
    {
      key: `${puhviKey}`,
      path: examPath(Exam.PUHVI),
      navigateTo: contentListPath(Exam.PUHVI, ContentType.koetehtavat)
    },
    {
      key: `${palautteetKey}`,
      path: feedbackPath()
    }
  ]
  const filteredPages = isYllapitaja ? pages : pages.filter((page) => page.path !== `/${palautteetKey}`)

  if (isMobile) {
    return <HeaderMobile pages={filteredPages} />
  }

  return <HeaderDesktop pages={filteredPages} />
}
