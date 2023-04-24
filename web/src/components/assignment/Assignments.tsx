import { Button } from '../Button'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { contentKey, newKey, navigationPages } from '../routes/routes'
import { useEffect, useState } from 'react'
import { AssignmentIn, ExamTypes, Exam, ExamType } from '../../types'
import { AssignmentTabs } from './AssignmentTabs'
import { AssignmentCard } from './AssignmentCard'
import {
  AssignmentKeyTranslationEnglish,
  AssignmentKeyTranslationFinnish,
  getSingularAssignmentFinnish
} from './assignmentUtils'
import { useFetch } from '../useFetch'
import { useTranslation } from 'react-i18next'

export const Assignments = () => {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const { exam, examType } = useParams()

  const defaultExamType = AssignmentKeyTranslationFinnish[examType!] as ExamType

  const { data: assignments, loading, error } = useFetch<AssignmentIn[]>(`assignment/${exam!.toLocaleUpperCase()}`)

  const { activeTab, setActiveTab } = useActiveTabAndUrlPathUpdate({
    assignmentType: defaultExamType || ExamTypes.KOETEHTAVAT,
    exam: exam as Exam
  })

  const singularActiveTab = getSingularAssignmentFinnish(activeTab)
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
        {loading && <div>Loading...</div>}
        {error && <div>{error}</div>}
        {assignments && assignments.length > 0 && (
          <ul>
            {assignments.map((assignment, i) => (
              <AssignmentCard assignment={assignment} key={i} />
            ))}
          </ul>
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
