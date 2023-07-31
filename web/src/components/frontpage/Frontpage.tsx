import { ContentType, EXAM_TYPES } from '../../types'
import { navigationPages } from '../routes/routes'
import { NavigationBoxes } from './FrontpageNavigationBoxes'
import { useUserDetails } from '../../hooks/useUserDetails'
import { useTranslation } from 'react-i18next'

export const Frontpage = () => {
  const { t } = useTranslation()
  const { firstNames } = useUserDetails()
  const exams = EXAM_TYPES.map((ex) => navigationPages[ex])
  const contentTypes = Object.values(ContentType)

  return (
    <div className="mt-10">
      <h2 data-testid="page-heading-etusivu">{t('frontpage.tervehdys', { nimi: firstNames })}</h2>
      <NavigationBoxes exams={exams} contentTypes={contentTypes} />
    </div>
  )
}
