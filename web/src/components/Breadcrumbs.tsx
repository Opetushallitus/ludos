import { InternalLink } from './InternalLink'
import { FAVORITE_ROOT_FOLDER_ID } from '../constants'
import { FolderList } from './modal/AssignmentFavoriteMoveFolderModal'
import { useLudosTranslation } from '../hooks/useLudosTranslation'
import { Exam } from '../types'
import { favoritesPagePath } from './LudosRoutes'

type BreadcrumbsProps = {
  exam: Exam
  segments: FolderList
}

export const Breadcrumbs = ({ exam, segments }: BreadcrumbsProps) => {
  const { lt } = useLudosTranslation()

  const pathsAndNames = segments.map((it) =>
    it.id === FAVORITE_ROOT_FOLDER_ID
      ? {
          id: exam.toLowerCase(),
          name: lt.headingTextByExam[exam]
        }
      : {
          id: it.id.toString(),
          name: it.name
        }
  )

  return (
    <div className="row">
      {pathsAndNames.map(({ name, id }, index) => {
        const isLast = index + 1 === pathsAndNames.length
        const path = id === exam.toLowerCase() ? `${favoritesPagePath()}/${id}` : `${favoritesPagePath(exam)}/${id}`

        return (
          <div key={index}>
            {isLast ? (
              <p>/ {name}</p>
            ) : (
              <InternalLink className="px-1" to={path}>
                {index > 0 ? '/ ' : ''}
                {name}
              </InternalLink>
            )}
          </div>
        )
      })}
    </div>
  )
}
