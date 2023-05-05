import { Button } from '../Button'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { newKey, navigationPages } from '../routes/routes'
import { useEffect, useState } from 'react'
import { ExamTypes, Exam, ExamType } from '../../types'
import { Tabs } from '../Tabs'
import {
  AssignmentKeyTranslationEnglish,
  AssignmentKeyTranslationFinnish,
  getSingularExamTypeFinnish
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
  const { examType } = useParams<{ examType: string }>()

  const defaultExamType = (AssignmentKeyTranslationFinnish[examType!] as ExamType) || ExamTypes.KOETEHTAVAT
  const { activeTab, setActiveTab } = useActiveTabAndUrlPathUpdate({
    examType: defaultExamType,
    exam
  })

  const singularActiveTab = getSingularExamTypeFinnish(activeTab)
  const headingTextKey = navigationPages[exam.toLowerCase()].titleKey

  return (
    <div className="pt-3">
      <h2 data-testid={`page-heading-${exam}`}>{t(`header.${headingTextKey}`)}</h2>

      <Tabs
        options={Object.values(ExamTypes)}
        activeTab={activeTab}
        setActiveTab={(opt) => setActiveTab(opt as ExamType)}
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
        {examType && activeTab && <AssignmentList exam={exam} examType={examType} activeTab={activeTab} />}
      </div>
    </div>
  )
}

function useActiveTabAndUrlPathUpdate({ examType, exam }: { examType: ExamType; exam: Exam }) {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<ExamType>(examType)

  useEffect(() => {
    if (activeTab) {
      navigate(`/${exam.toLowerCase()}/${AssignmentKeyTranslationEnglish[activeTab]}`, { replace: true })
    }
  }, [activeTab, navigate, examType, exam])

  return { activeTab, setActiveTab }
}
