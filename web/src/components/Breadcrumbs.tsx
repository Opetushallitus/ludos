import { InternalLink } from './InternalLink'
import { FAVORITE_ROOT_FOLDER_ID } from '../constants'
import { FolderList } from './modal/AssignmentFavoriteMoveFolderModal'
import { useLudosTranslation } from '../hooks/useLudosTranslation'
import { ContentTypeByContentTypePluralFi, ContentTypePluralFi, Exam } from '../types'
import { contentListPath, examPath, favoritesPagePath, frontpagePath } from './LudosRoutes'
import { useParams } from 'react-router-dom'

const BreadcrumbItem = ({ last, name, index, path }: { last: boolean; name: string; path: string; index: number }) => (
  <div className="text-sm">
    {last ? (
      <p>/ {name}</p>
    ) : (
      <>
        {index > 0 ? '/ ' : ''}
        <InternalLink className="pr-1" to={path}>
          {name}
        </InternalLink>
      </>
    )}
  </div>
)

type BreadcrumbsProps = {
  exam: Exam
  segments: FolderList
}

export const FavoriteFolderBreadcrumbs = ({ exam, segments }: BreadcrumbsProps) => {
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
    <div className="row flex-wrap">
      {pathsAndNames.map(({ name, id }, index) => (
        <BreadcrumbItem
          last={index + 1 === pathsAndNames.length}
          name={name}
          path={id === exam.toLowerCase() ? `${favoritesPagePath(exam)}` : `${favoritesPagePath(exam)}/${id}`}
          index={index}
          key={index}
        />
      ))}
    </div>
  )
}

export const ContentBreadcrumbs = ({ exam, name }: { exam: Exam; name: string }) => {
  const { t, lt } = useLudosTranslation()
  const { contentTypePluralFi } = useParams<{
    contentTypePluralFi: ContentTypePluralFi
    id: string
  }>()

  const segments = [
    {
      path: frontpagePath(),
      name: t('header.etusivu')
    },
    {
      path: examPath(exam),
      name: lt.headingTextByExam[exam]
    },
    {
      path: contentListPath(exam, ContentTypeByContentTypePluralFi[contentTypePluralFi!]),
      name: lt.tabTextByContentType[ContentTypeByContentTypePluralFi[contentTypePluralFi!]]
    },
    {
      path: '',
      name: name
    }
  ]

  return (
    <div className="row flex-wrap">
      {segments.map(({ name, path }, index) => (
        <BreadcrumbItem last={index + 1 === segments.length} name={name} path={path} index={index} key={index} />
      ))}
    </div>
  )
}
