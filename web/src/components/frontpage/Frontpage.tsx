import { AssignmentTypes, EXAM_TYPES } from '../../types'
import { navigationPages } from '../routes/routes'
import { NavigationBoxes } from './FrontpageNavigationBoxes'

export const Frontpage = () => {
  const examTypes = EXAM_TYPES.map((ex) => navigationPages[ex])
  const assignmentTypes = Object.values(AssignmentTypes)

  return (
    <div className="mt-10">
      <h2 data-testid="page-heading-etusivu">Hei Yrjö Ylivoima, tervetuloa Koepankin ylläpitoon!</h2>
      <NavigationBoxes exams={examTypes} assignments={assignmentTypes} />
    </div>
  )
}
