import { useLudosTranslation } from '../../../hooks/useLudosTranslation'
import { Exam } from '../../../types'
import { NavLink } from 'react-router-dom'
import { favoritesPagePath } from '../../LudosRoutes'

export const AssignmentFavoriteExamMenu = () => {
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
