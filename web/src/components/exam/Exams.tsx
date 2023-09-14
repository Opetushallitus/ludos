import { useNavigate, useParams } from 'react-router-dom'
import { navigationPages } from '../routes/routes'
import { useEffect, useState } from 'react'
import { ContentType, Exam } from '../../types'
import { Tabs } from '../Tabs'
import { ContentTypeTranslationEnglish, ContentTypeTranslationFinnish } from './assignment/assignmentUtils'
import { useTranslation } from 'react-i18next'
import { ContentList } from './contentList/ContentList'

type ExamProps = {
  exam: Exam
}

function useActiveTabAndUrlPathUpdate({ contentType, exam }: { contentType: ContentType; exam: Exam }) {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<ContentType>(contentType)

  useEffect(() => {
    if (activeTab) {
      navigate(`/${exam.toLowerCase()}/${ContentTypeTranslationEnglish[activeTab]}`, { replace: true })
    }
  }, [activeTab, navigate, contentType, exam])

  return { activeTab, setActiveTab }
}

const Exams = ({ exam }: ExamProps) => {
  const { t } = useTranslation()
  const { contentType } = useParams<{ contentType: string }>()

  const defaultContentType = (ContentTypeTranslationFinnish[contentType!] as ContentType) || ContentType.KOETEHTAVAT
  const { activeTab, setActiveTab } = useActiveTabAndUrlPathUpdate({
    contentType: defaultContentType,
    exam
  })

  const headingTextKey = navigationPages[exam.toLowerCase()].key

  return (
    <div className="pt-3">
      <h2 className="mb-3" data-testid={`page-heading-${exam.toLowerCase()}`}>
        {t(`header.${headingTextKey}`)}
      </h2>

      <Tabs
        options={Object.values(ContentType)}
        activeTab={activeTab}
        setActiveTab={(opt) => setActiveTab(opt as ContentType)}
      />

      <div role="tabpanel">
        {contentType && activeTab && <ContentList exam={exam} contentType={contentType} activeTab={activeTab} />}
      </div>
    </div>
  )
}

export default Exams
