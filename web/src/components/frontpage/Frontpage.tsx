import { ContentType, EXAM_TYPES } from '../../types'
import { etusivuKey, navigationPages } from '../routes/routes'
import { NavigationBoxes } from './FrontpageNavigationBoxes'
import { useUserDetails } from '../../hooks/useUserDetails'
import { useTranslation } from 'react-i18next'

export const Frontpage = () => {
  const { t } = useTranslation()
  const { firstNames } = useUserDetails()
  const examPages = EXAM_TYPES.map((ex) => navigationPages[ex])

  return (
    <div className="mt-10">
      <h2 data-testid={`page-heading-${etusivuKey}`}>{t('frontpage.tervehdys', { nimi: firstNames })}</h2>
      <NavigationBoxes examPages={examPages} />
    </div>
  )
}
