import { Exam } from '../../../../types'
import { useTranslation } from 'react-i18next'
import { FavoriteContentList } from './FavoriteContentList'
import { NavLink, useParams } from 'react-router-dom'
import { favoritesPagePath } from '../../../routes/LudosRoutes'

const ExamMenu = () => {
  const { t } = useTranslation()

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
            {t(`tab.${exam.toLowerCase()}`)}
          </NavLink>
        ))}
      </div>
    </div>
  )
}

export const AssignmentFavorite = () => {
  const { t } = useTranslation()
  const { exam: examParamLowerCase } = useParams<{ exam: string }>()

  if (!((examParamLowerCase?.toUpperCase() as Exam) in Exam)) {
    return null
  }

  const exam = Exam[examParamLowerCase?.toUpperCase() as Exam]

  return (
    <div className="pt-3">
      <h2 className="mb-3" data-testid="favorite-page-heading">
        {t('favorite.suosikkitehtavat')}
      </h2>

      <ExamMenu />

      <div role="tabpanel">
        <FavoriteContentList exam={exam} />
      </div>
    </div>
  )
}
