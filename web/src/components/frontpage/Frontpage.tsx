import { ContentType, EXAM_TYPES } from '../../types'
import { navigationPages } from '../routes/routes'
import { NavigationBoxes } from './FrontpageNavigationBoxes'

export const Frontpage = ({ username }: { username?: string }) => {
  const exams = EXAM_TYPES.map((ex) => navigationPages[ex])
  const contentTypes = Object.values(ContentType)

  return (
    <div className="mt-10">
      {username && <h2 data-testid="page-heading-etusivu">Hei {username}, tervetuloa Koepankin ylläpitoon!</h2>}
      <NavigationBoxes exams={exams} contentTypes={contentTypes} />
    </div>
  )
}
