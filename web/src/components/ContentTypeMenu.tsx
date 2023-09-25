import { useTranslation } from 'react-i18next'
import { ContentType, Exam } from '../types'
import { NavLink } from 'react-router-dom'
import { contentListPath } from './routes/LudosRoutes'

type ContentTypeMenuProps = {
  exam: Exam
}

export const ContentTypeMenu = ({ exam }: ContentTypeMenuProps) => {
  const { t } = useTranslation()

  return (
    <div className="text-gray-500 text-center text-base">
      <div className="flex flex-wrap border-b-4 border-gray-separator font-semibold">
        {Object.values(ContentType).map((contentType: ContentType, i) => (
          <NavLink
            to={contentListPath(exam, contentType)}
            className={({ isActive }) =>
              `inline-block cursor-pointer rounded-t-lg px-3 py-1 hover:bg-gray-light${
                isActive ? ' -mb-1 border-b-4 border-b-green-primary text-green-primary' : ''
              }`
            }
            key={i}
            data-testid={`tab-${contentType}`}>
            {t(`tab.${contentType}`)}
          </NavLink>
        ))}
      </div>
    </div>
  )
}
