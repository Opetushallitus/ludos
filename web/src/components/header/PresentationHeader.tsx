import { useMediaQuery } from '../../hooks/useMediaQuery'
import { IS_MOBILE_QUERY, LOGOUT_URL } from '../../constants'
import { useUserDetails } from '../../hooks/useUserDetails'
import { feedbackKey, navigationPages } from '../routes/routes'
import { HeaderMobile } from './HeaderMobile'
import { HeaderDesktop } from './HeaderDesktop'
import { useTranslation } from 'react-i18next'
import { useConstantsWithLocalization } from '../../hooks/useConstantsWithLocalization'
import { HeaderDropdown } from './HeaderDropdown'
import { NavLink } from 'react-router-dom'

export const PresentationHeader = () => {
  const { t } = useTranslation()

  return (
    <div className="flex justify-center bg-gray-bg pb-6">
      <div className="row w-[80vw] justify-between pt-3">
        <h1>{t('title.ludos')}</h1>
      </div>
    </div>
  )
}
