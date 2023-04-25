import { Button } from '../Button'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { contentKey, newKey, navigationPages } from '../routes/routes'
import { useEffect, useState } from 'react'
import { ExamTypes, Exam, ExamType } from '../../types'
import { AssignmentTabs } from './AssignmentTabs'
import {
  AssignmentKeyTranslationEnglish,
  AssignmentKeyTranslationFinnish,
  getSingularExamTypeFinnish
} from './assignmentUtils'
import { useTranslation } from 'react-i18next'
import { AssignmentList } from './AssignmentList'
import { AssignmentFilters } from './AssignmentFilters'
import { useFilters } from './useFilters'

export const Assignments = () => {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const { exam, examType } = useParams<{ exam: Exam; examType: string }>()

  const defaultExamType = (AssignmentKeyTranslationFinnish[examType!] as ExamType) || ExamTypes.KOETEHTAVAT
  const { activeTab, setActiveTab } = useActiveTabAndUrlPathUpdate({
    assignmentType: defaultExamType,
    exam: exam!
  })

  const { filters, setFilters } = useFilters()

  const singularActiveTab = getSingularExamTypeFinnish(activeTab)
  const headingTextKey = navigationPages[exam as string].titleKey

  return (
    <div className="pt-3">
      <h2 data-testid={`page-heading-${contentKey}-${exam}`}>{t(`header.${headingTextKey}`)}</h2>

      <AssignmentTabs activeTab={activeTab} setActiveTab={setActiveTab} t={t} />

      <div role="tabpanel">
        <div className="my-5">
          <Button
            variant="buttonPrimary"
            onClick={() => navigate(`${location.pathname}/${newKey}`)}
            data-testid={`create-${singularActiveTab}-button`}>
            {t(`button.lisaa${singularActiveTab}`)}
          </Button>
        </div>
        <AssignmentFilters filters={filters} setFilters={setFilters} />
        {examType && (
          <AssignmentList
            url={`assignment/${exam!.toLocaleUpperCase()}?examType=${examType.toUpperCase()}`}
            filters={filters}
          />
        )}
      </div>
    </div>
  )
}

function useActiveTabAndUrlPathUpdate({ assignmentType, exam: examType }: { assignmentType: ExamType; exam: Exam }) {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<ExamType>(assignmentType)

  useEffect(() => {
    if (activeTab) {
      navigate(`/${contentKey}/${examType}/${AssignmentKeyTranslationEnglish[activeTab]}`, { replace: true })
    }
  }, [activeTab, navigate, examType])

  return { activeTab, setActiveTab }
}
