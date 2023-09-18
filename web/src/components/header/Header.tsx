import { useMediaQuery } from '../../hooks/useMediaQuery'
import { IS_MOBILE_QUERY } from '../../constants'
import { HeaderMobile } from './HeaderMobile'
import { HeaderDesktop } from './HeaderDesktop'
import { palautteetKey, navigationPages } from '../routes/routes'
import { useUserDetails } from '../../hooks/useUserDetails'

export const Header = () => {
  const isMobile = useMediaQuery({ query: IS_MOBILE_QUERY })
  const { isYllapitaja } = useUserDetails()

  const pages = Object.values(navigationPages)
  const filteredPages = isYllapitaja ? pages : pages.filter((page) => page.path !== `/${palautteetKey}`)

  if (isMobile) {
    return <HeaderMobile pages={filteredPages} />
  }

  return <HeaderDesktop pages={filteredPages} />
}
