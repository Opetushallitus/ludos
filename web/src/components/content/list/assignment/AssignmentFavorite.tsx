import { Exam } from '../../../../types'
import { NavLink, useParams } from 'react-router-dom'
import { favoritesPagePath } from '../../../LudosRoutes'
import { useLudosTranslation } from '../../../../hooks/useLudosTranslation'
import { AssignmentList } from './AssignmentList'
import { useFilterValues } from '../../../../hooks/useFilterValues'

const ExamMenu = () => {
  const { lt } = useLudosTranslation()

  return (
    <div className="text-gray-500 text-center text-base">
      <div className="flex flex-wrap border-b-4 border-gray-separator font-semibold">
        {Object.values(Exam).map((exam, i) => (
          <NavLink
            to={favoritesPagePath(exam)}
            className={({ isActive }) =>
              `inline-block cursor-pointer rounded-t-lg px-3 py-1 hover:bg-gray-light${
                isActive ? ' -mb-1 border-b-4 border-b-green-primary text-green-primary' : ''
              }`
            }
            key={i}
            data-testid={`tab-${exam.toLowerCase()}`}>
            {lt.tabTextByExam[exam]}
          </NavLink>
        ))}
      </div>
    </div>
  )
}

export const AssignmentFavorite = () => {
  const { t } = useLudosTranslation()
  const { exam: examParamLowerCase } = useParams<{ exam: string }>()
  const exam = Exam[examParamLowerCase?.toUpperCase() as Exam]
  const filterValues = useFilterValues(exam, true)

  return (
    <div className="pt-3">
      <h2 className="mb-3" data-testid="favorite-page-heading">
        {t('favorite.suosikkitehtavat')}
      </h2>

      <ExamMenu />

      <div role="tabpanel">
        <AssignmentList exam={exam} filterValues={filterValues} isFavoritePage />
      </div>
    </div>
  )
}
