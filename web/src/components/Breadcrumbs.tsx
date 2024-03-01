import { InternalLink } from './InternalLink'
import { FAVORITE_ROOT_FOLDER_ID } from '../constants'
import { FolderList } from './modal/AssignmentFavoriteMoveFolderModal'
import { useLudosTranslation } from '../hooks/useLudosTranslation'
import {
  ContentBaseOut,
  ContentTypeByContentTypePluralFi,
  ContentTypePluralFi,
  ContentTypeSingularEn,
  Exam
} from '../types'
import { contentListPath, examPath, favoritesPagePath, frontpagePath } from './LudosRoutes'
import { useParams } from 'react-router-dom'
import { useFetch } from '../hooks/useFetch'

const BreadcrumbItem = ({ last, name, index, path }: { last: boolean; name: string; path: string; index: number }) => (
  <div>
    {last ? (
      <p>/ {name}</p>
    ) : (
      <InternalLink className="px-1" to={path}>
        {index > 0 ? '/ ' : ''}
        {name}
      </InternalLink>
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
          path={id === exam.toLowerCase() ? `${favoritesPagePath()}/${id}` : `${favoritesPagePath(exam)}/${id}`}
          index={index}
          key={index}
        />
      ))}
    </div>
  )
}

export const ContentBreadcrumbs = ({ exam }: { exam: Exam }) => {
  const { t, lt } = useLudosTranslation()
  const { contentTypePluralFi, id } = useParams<{
    contentTypePluralFi: ContentTypePluralFi
    id: string
  }>()

  const contentTypeSingularEn = ContentTypeSingularEn[ContentTypeByContentTypePluralFi[contentTypePluralFi!]]
  const { data } = useFetch<ContentBaseOut>(`${contentTypeSingularEn}/${exam}/${id}`)

  if (!data) {
    return null
  }

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
      name: data.nameFi
    }
  ]

  return (
    <div className="row flex-wrap mb-5">
      {segments.map(({ name, path }, index) => (
        <BreadcrumbItem last={index + 1 === segments.length} name={name} path={path} index={index} key={index} />
      ))}
    </div>
  )
}
