import { NavigationBoxes } from './FrontpageNavigationBoxes'
import { useUserDetails } from '../../hooks/useUserDetails'
import { useTranslation } from 'react-i18next'
import { etusivuKey } from '../routes/LudosRoutes'

export const Frontpage = () => {
  const { t } = useTranslation()
  const { firstNames } = useUserDetails()

  return (
    <div className="mt-10">
      <h2 data-testid={`page-heading-${etusivuKey}`}>{t('frontpage.tervehdys', { nimi: firstNames })}</h2>
      <NavigationBoxes />
    </div>
  )
}
