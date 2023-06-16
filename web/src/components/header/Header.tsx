import { useMediaQuery } from '../../hooks/useMediaQuery'
import { IS_MOBILE_QUERY } from '../../constants'
import { HeaderMobile } from './HeaderMobile'
import { HeaderDesktop } from './HeaderDesktop'

export const Header = () => {
  const isMobile = useMediaQuery({ query: IS_MOBILE_QUERY })

  if (isMobile) {
    return <HeaderMobile />
  }

  return <HeaderDesktop />
}
