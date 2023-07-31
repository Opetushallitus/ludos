import { ContentType, EXAM_TYPES } from '../../types'
import { navigationPages } from '../routes/routes'
import { NavigationBoxes } from './FrontpageNavigationBoxes'
import { useUserDetails } from '../../hooks/useUserDetails'

export const Frontpage = () => {
  const { name } = useUserDetails()
  const exams = EXAM_TYPES.map((ex) => navigationPages[ex])
  const contentTypes = Object.values(ContentType)

  return (
    <div className="mt-10">
      <h2 data-testid="page-heading-etusivu">Hei{name ? ` ${name}` : ''}, tervetuloa Koepankin ylläpitoon!</h2>
      <NavigationBoxes exams={exams} contentTypes={contentTypes} />
    </div>
  )
}
