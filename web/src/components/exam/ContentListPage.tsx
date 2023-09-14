import { useNavigate, useParams } from 'react-router-dom'
import { navigationPages } from '../routes/routes'
import { useEffect, useState } from 'react'
import { ContentType, Exam } from '../../types'
import { Tabs } from '../Tabs'
import { useTranslation } from 'react-i18next'
import { ContentList } from './contentList/ContentList'

type ContentListPageProps = {
  exam: Exam
}

function useActiveTabAndUrlPathUpdate({ contentType, exam }: { contentType: ContentType; exam: Exam }) {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<ContentType>(contentType)

  useEffect(() => {
    if (activeTab) {
      navigate(`/${exam.toLowerCase()}/${ContentType[activeTab]}`, { replace: true })
    }
  }, [activeTab, navigate, contentType, exam])

  return { activeTab, setActiveTab }
}

const ContentListPage = ({ exam }: ContentListPageProps) => {
  const { t } = useTranslation()
  const { contentType } = useParams<{ contentType: ContentType }>()

  const { activeTab, setActiveTab } = useActiveTabAndUrlPathUpdate({
    contentType: contentType || ContentType.koetehtavat,
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

export default ContentListPage
