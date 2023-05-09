import { ContentTypes, EXAM_TYPES } from '../../types'
import { navigationPages } from '../routes/routes'
import { NavigationBoxes } from './FrontpageNavigationBoxes'
import { useFetch } from '../../hooks/useFetch'

export const Frontpage = () => {
  const { data } = useFetch<{ name: string }>('auth')
  const exams = EXAM_TYPES.map((ex) => navigationPages[ex])
  const assignmentTypes = Object.values(ContentTypes)

  return (
    <div className="mt-10">
      {data && <h2 data-testid="page-heading-etusivu">Hei {data.name}, tervetuloa Koepankin ylläpitoon!</h2>}
      <NavigationBoxes exams={exams} assignments={assignmentTypes} />
    </div>
  )
}
