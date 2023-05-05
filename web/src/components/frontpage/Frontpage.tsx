import { ExamTypes, EXAM_TYPES } from '../../types'
import { navigationPages } from '../routes/routes'
import { NavigationBoxes } from './FrontpageNavigationBoxes'
import { useFetch } from '../../hooks/useFetch'

export const Frontpage = () => {
  const { data } = useFetch<{ name: string }>('auth')
  const examTypes = EXAM_TYPES.map((ex) => navigationPages[ex])
  const assignmentTypes = Object.values(ExamTypes)

  return (
    <div className="mt-10">
      {data && <h2 data-testid="page-heading-etusivu">Hei {data.name}, tervetuloa Koepankin ylläpitoon!</h2>}
      <NavigationBoxes exams={examTypes} assignments={assignmentTypes} />
    </div>
  )
}
