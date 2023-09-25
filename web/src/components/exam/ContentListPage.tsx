import { useParams } from 'react-router-dom'
import { ContentType, Exam } from '../../types'
import { useTranslation } from 'react-i18next'
import { ContentList } from './contentList/ContentList'
import { ContentTypeMenu } from '../ContentTypeMenu'
import { ContentListHeader } from './contentList/ContentListHeader'
import { useFilterValues } from '../../hooks/useFilterValues'
import { useState } from 'react'

type ContentListPageProps = {
  exam: Exam
}

const ContentListPage = ({ exam }: ContentListPageProps) => {
  const { t } = useTranslation()
  const { contentType: contentTypeParam } = useParams<{ contentType: ContentType }>()
  const contentType = contentTypeParam || ContentType.koetehtavat
  const { filterValues, setFilterValue } = useFilterValues(exam)

  const [language, setLanguage] = useState<string>('fi')

  return (
    <div className="pt-3">
      <h2 className="mb-3" data-testid={`page-heading-${exam.toLowerCase()}`}>
        {t(`header.${exam.toLowerCase()}`)}
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
              language={language}
              setLanguage={setLanguage}
            />
            <ContentList exam={exam} contentType={contentType} language={language} filterValues={filterValues} />
          </>
        )}
      </div>
    </div>
  )
}

export default ContentListPage
