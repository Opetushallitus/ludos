import { Button } from '../Button'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { newKey, navigationPages } from '../routes/routes'
import { useEffect, useState } from 'react'
import { ContentTypes, Exam, ContentType } from '../../types'
import { Tabs } from '../Tabs'
import {
  ContentTypeTranslationEnglish,
  ContentTypeTranslationFinnish,
  getSingularContentTypeFinnish
} from './assignment/assignmentUtils'
import { useTranslation } from 'react-i18next'
import { AssignmentList } from './assignment/AssignmentList'

type ExamProps = {
  exam: Exam
}

export const Exams = ({ exam }: ExamProps) => {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const { contentType } = useParams<{ contentType: string }>()

  const defaultContentType = (ContentTypeTranslationFinnish[contentType!] as ContentType) || ContentTypes.KOETEHTAVAT
  const { activeTab, setActiveTab } = useActiveTabAndUrlPathUpdate({
    contentType: defaultContentType,
    exam
  })

  const singularActiveTab = getSingularContentTypeFinnish(activeTab)
  const headingTextKey = navigationPages[exam.toLowerCase()].titleKey

  return (
    <div className="pt-3">
      <h2 data-testid={`page-heading-${exam}`}>{t(`header.${headingTextKey}`)}</h2>

      <Tabs
        options={Object.values(ContentTypes)}
        activeTab={activeTab}
        setActiveTab={(opt) => setActiveTab(opt as ContentType)}
      />

      <div role="tabpanel">
        <div className="my-5">
          <Button
            variant="buttonPrimary"
            onClick={() => navigate(`${location.pathname}/${newKey}`)}
            data-testid={`create-${singularActiveTab}-button`}>
            {t(`button.lisaa${singularActiveTab}`)}
          </Button>
        </div>
        {contentType && activeTab && <AssignmentList exam={exam} contentType={contentType} activeTab={activeTab} />}
      </div>
    </div>
  )
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
