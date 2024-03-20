import { NavigationBoxes } from './FrontpageNavigationBoxes'
import { useUserDetails } from '../../hooks/useUserDetails'
import { etusivuKey } from '../LudosRoutes'
import { useLudosTranslation } from '../../hooks/useLudosTranslation'

export const Frontpage = () => {
  const { t } = useLudosTranslation()
  const { firstNames } = useUserDetails()

  return (
    <div className="mt-10">
      <h2 data-testid={`page-heading-${etusivuKey}`}>{t('frontpage.tervehdys', { nimi: firstNames ?? '' })}</h2>
      <NavigationBoxes />
    </div>
  )
}
