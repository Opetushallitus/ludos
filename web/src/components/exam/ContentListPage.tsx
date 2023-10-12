import { useParams } from 'react-router-dom'
import { ContentType, Exam, TeachingLanguage } from '../../types'
import { ContentList } from './contentList/ContentList'
import { ContentTypeMenu } from '../ContentTypeMenu'
import { ContentListHeader } from './contentList/ContentListHeader'
import { useFilterValues } from '../../hooks/useFilterValues'
import { useState } from 'react'
import { useLudosTranslation } from '../../hooks/useLudosTranslation'

type ContentListPageProps = {
  exam: Exam
}

const ContentListPage = ({ exam }: ContentListPageProps) => {
  const { lt } = useLudosTranslation()
  const { contentType: contentTypeParam } = useParams<{ contentType: ContentType }>()
  const contentType = contentTypeParam || ContentType.koetehtavat
  const { filterValues, setFilterValue } = useFilterValues(exam)
  const [teachingLanguage, setTeachingLanguage] = useState<TeachingLanguage>(TeachingLanguage.fi)

  const languageOverrideIfSukoAssignment =
    exam === Exam.SUKO && contentType === ContentType.koetehtavat ? 'fi' : teachingLanguage

  return (
    <div className="pt-3">
      <h2 className="mb-3" data-testid={`page-heading-${exam.toLowerCase()}`}>
        {lt.headingTextByExam[exam]}
      </h2>

      <ContentTypeMenu exam={exam} />

      <div role="tabpanel">
        {contentType && (
          <>
            <ContentListHeader
              exam={exam}
              contentType={contentType}
              filterValues={filterValues}
              setFilterValue={setFilterValue}
              teachingLanguage={languageOverrideIfSukoAssignment}
              setTeachingLanguage={setTeachingLanguage}
            />
            <ContentList
              exam={exam}
              contentType={contentType}
              teachingLanguage={languageOverrideIfSukoAssignment}
              filterValues={filterValues}
            />
          </>
        )}
      </div>
    </div>
  )
}

export default ContentListPage
